class DefaultRate {
    constructor() {
        this.API_ENDPOINT = '/default-rate/data';
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
        // default load: last 30 days
        this.setPeriodAndFilter('daily', 30);
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

    async fetchData(start_date, end_date, type) {
        const params = new URLSearchParams({ start_date, end_date, type });
        const url = `${this.API_ENDPOINT}?${params.toString()}`;
        const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
        }
        const payload = await res.json();
        return payload.data || [];
    }

    async loadData() {
        const start = document.getElementById('dr-start-date')?.value;
        const end = document.getElementById('dr-end-date')?.value;
        const type = document.getElementById('dr-period-type')?.value || 'daily';
        try {
            if (!start || !end) throw new Error('Selecione datas válidas');
            const raw = await this.fetchData(start, end, type);
            const processed = this.process(raw, type);
            this.renderChart(processed.labels, processed.values);
        } catch (err) {
            alert(err.message || 'Erro ao carregar dados');
        }
    }

    process(data, type) {
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

    renderChart(labels, values) {
        const ctx = document.getElementById('default-rate-chart');
        if (!ctx) return;
        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Taxa de Inadimplência (%)',
                    data: values,
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#0066CC'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { stacked: true },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: { callback: (v) => v + '%' }
                    }
                }
            }
        });
    }
}

window.DefaultRate = new DefaultRate();
