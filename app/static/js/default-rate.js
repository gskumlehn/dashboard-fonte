class DefaultRate {
    constructor() {
        this.API_CONFIG = {
            currentRateEndpoint: '/default-rate',
            historicalDataEndpoint: '/default-rate/data'
        };
        this.chart = null;
        this.initialize();
    }

    initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.bindShortcuts();
        const applyBtn = document.getElementById('dr-apply-filter');
        if (applyBtn) applyBtn.addEventListener('click', () => this.loadData());
        // Default load: last 7 days in daily mode
        this.setPeriodAndFilter('daily', 7);
    }

    bindShortcuts() {
        const container = document.getElementById('default-rate-shortcuts');
        if (!container) return;
        const buttons = container.querySelectorAll('button[data-period]');
        buttons.forEach(btn => {
            const period = parseInt(btn.dataset.period, 10);
            btn.addEventListener('click', () => {
                if (Number.isNaN(period)) return;
                if (period <= 31) {
                    this.setPeriodAndFilter('daily', period);
                } else {
                    const months = Math.round(period / 30);
                    this.setPeriodAndFilter('monthly', null, months);
                }
            });
        });
    }

    async setPeriodAndFilter(type, days = null, months = null) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let start = new Date(today);

        if (type === 'daily' && Number.isInteger(days)) {
            start.setDate(start.getDate() - days);
        } else if (type === 'monthly' && Number.isInteger(months)) {
            const startMonth = today.getMonth() - (months - 1);
            start = new Date(today.getFullYear(), startMonth, 1);
        } else {
            throw new Error('Invalid parameters for setPeriodAndFilter');
        }

        const startInput = document.getElementById('dr-start-date');
        const endInput = document.getElementById('dr-end-date');
        const typeSelect = document.getElementById('dr-period-type');

        if (startInput) startInput.value = this.formatDateInput(start);
        if (endInput) endInput.value = this.formatDateInput(today);
        if (typeSelect) typeSelect.value = type;

        await this.loadData();
    }

    formatDateInput(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async fetchCurrentRate() {
        try {
            const url = this.API_CONFIG.currentRateEndpoint;
            const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            const payload = await res.json();
            return payload || {};
        } catch (err) {
            console.error('Error fetching current default rate:', err);
            throw err;
        }
    }

    async fetchHistoricalData(start_date, end_date, type) {
        try {
            const params = new URLSearchParams({ start_date, end_date, type });
            const url = `${this.API_CONFIG.historicalDataEndpoint}?${params.toString()}`;
            const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            const payload = await res.json();
            return payload.data || [];
        } catch (err) {
            console.error('Error fetching historical default rate data:', err);
            throw err;
        }
    }

    async loadData() {
        const start = document.getElementById('dr-start-date')?.value;
        const end = document.getElementById('dr-end-date')?.value;
        const type = document.getElementById('dr-period-type')?.value || 'daily';

        try {
            if (!start || !end) throw new Error('Selecione datas válidas');

            // Fetch current default rate
            const currentRate = await this.fetchCurrentRate();
            this.updateCurrentMetrics(currentRate);

            // Fetch historical data
            const historicalData = await this.fetchHistoricalData(start, end, type);
            const processed = this.processHistoricalData(historicalData, type);
            this.renderChart(processed.labels, processed.values);
        } catch (err) {
            alert(err.message || 'Erro ao carregar dados');
        }
    }

    updateCurrentMetrics(data) {
        const overdueDocumentsEl = document.querySelector('.metric-value[data-metric="overdue-documents"]');
        const openDocumentsEl = document.querySelector('.metric-value[data-metric="open-documents"]');
        const overdueValueEl = document.querySelector('.metric-value[data-metric="overdue-value"]');
        const openValueEl = document.querySelector('.metric-value[data-metric="open-value"]');
        const defaultRatePercentEl = document.querySelector('.metric-rate[data-metric="default-rate-percent"]');

        if (overdueDocumentsEl) overdueDocumentsEl.textContent = data.overdue_documents || 0;
        if (openDocumentsEl) openDocumentsEl.textContent = data.open_documents || 0;
        if (overdueValueEl) overdueValueEl.textContent = `R$ ${data.overdue_value?.toFixed(2) || '0.00'}`;
        if (openValueEl) openValueEl.textContent = `R$ ${data.open_value?.toFixed(2) || '0.00'}`;
        if (defaultRatePercentEl) defaultRatePercentEl.textContent = `${data.default_rate_percent?.toFixed(2) || '0.00'}%`;
    }

    processHistoricalData(data, type) {
        const labels = [];
        const values = [];
        data.forEach(item => {
            const d = new Date(item.date);
            const label = type === 'monthly'
                ? `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
                : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            labels.push(label);
            values.push(parseFloat(item.rate) || 0);
        });
        return { labels, values };
    }

    getCSSVariable(variableName) {
        return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    }

    renderChart(labels, values) {
        const ctx = document.getElementById('default-rate-chart');
        if (!ctx) return;
        if (this.chart) this.chart.destroy();

        const primaryColor = this.getCSSVariable('--primary');
        const primaryBgColor = this.getCSSVariable('--primary').replace(')', ', 0.1)').replace('rgb', 'rgba');
        const blueColor = this.getCSSVariable('--blue');
        const blueBgColor = this.getCSSVariable('--blue').replace(')', ', 0.1)').replace('rgb', 'rgba');

        this.chart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Taxa de Inadimplência (%)',
                    data: values,
                    backgroundColor: primaryBgColor,
                    borderColor: primaryColor,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { stacked: true },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
}

window.DefaultRate = new DefaultRate();
