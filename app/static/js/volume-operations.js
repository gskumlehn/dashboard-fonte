class VolumeOperations {
    constructor() {
        this.API_CONFIG = {
            baseUrl: '/operations',
            endpoint: '/volume-data'
        };
        this.chartInstance = null;
        this.currentData = [];
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
        this.initializeFilters();
        this.loadInitialData();
    }

    initializeFilters() {
        const shortcuts = [
            { label: 'Últimos 7 dias', days: 7 },
            { label: 'Último mês', days: 30 },
            { label: 'Últimos 3 meses', days: 90 },
            { label: 'Último ano', days: 365 }
        ];

        const shortcutsContainer = document.getElementById('filter-shortcuts');
        if (shortcutsContainer) {
            shortcuts.forEach(shortcut => {
                const button = document.createElement('button');
                button.className = 'btn-outline btn-sm';
                button.textContent = shortcut.label;
                button.dataset.days = shortcut.days;
                button.addEventListener('click', () => this.setPeriod(shortcut.days));
                shortcutsContainer.appendChild(button);
            });
        }

        const filterButton = document.getElementById('filter-button');
        if (filterButton) {
            filterButton.addEventListener('click', () => this.loadData());
        }
    }

    setPeriod(days) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        if (startDateInput) startDateInput.value = this.formatDateInput(startDate);
        if (endDateInput) endDateInput.value = this.formatDateInput(endDate);
    }

    formatDateInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    loadInitialData() {
        this.setPeriod(30);
        this.loadData();
    }

    validateDates(startDate, endDate) {
        if (!startDate || !endDate) {
            throw new Error('Por favor, selecione as datas de início e fim.');
        }
        if (new Date(startDate) > new Date(endDate)) {
            throw new Error('A data de início não pode ser maior que a data de fim.');
        }
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (new Date(endDate) > today) {
            throw new Error('A data de fim não pode ser futura.');
        }
        return true;
    }

    async fetchVolumeData(start_date, end_date, type = 'monthly') {
        try {
            const params = new URLSearchParams({
                start_date: encodeURIComponent(start_date),
                end_date: encodeURIComponent(end_date),
                type: encodeURIComponent(type)
            });
            const url = `${this.API_CONFIG.baseUrl}${this.API_CONFIG.endpoint}?${params}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Erro ao buscar dados do volume: ${response.status} ${response.statusText}`);
            }
            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error('Erro ao buscar dados do volume:', error);
            throw error;
        }
    }

    async loadData() {
        const startDate = document.getElementById('start-date')?.value;
        const endDate = document.getElementById('end-date')?.value;
        const periodType = document.getElementById('period-type')?.value || 'monthly';
        const filterButton = document.getElementById('filter-button');

        try {
            this.validateDates(startDate, endDate);
            if (filterButton) {
                filterButton.disabled = true;
                filterButton.textContent = 'Carregando...';
            }
            const data = await this.fetchVolumeData(startDate, endDate, periodType);
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Nenhum dado encontrado para o período selecionado.');
            }
            this.currentData = this.processData(data, periodType);
            this.updateKPIs(this.currentData);
            this.updateChart(this.currentData, periodType);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert(error.message || 'Erro ao carregar dados. Tente novamente.');
        } finally {
            if (filterButton) {
                filterButton.disabled = false;
                filterButton.textContent = 'Filtrar';
            }
        }
    }

    processData(data, periodType) {
        return data.map(item => ({
            date: item.date,
            dateFormatted: this.formatDate(item.date, periodType),
            volume: parseFloat(item.total_volume) || 0,
            ticket: parseFloat(item.average_ticket) || 0,
            numOperations: Math.round(item.total_volume / item.average_ticket) || 0
        }));
    }

    formatDate(dateString, type) {
        if (type === 'monthly') {
            const [year, month] = dateString.split('-');
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return `${months[parseInt(month) - 1]}/${year}`;
        } else {
            const date = new Date(dateString + 'T00:00:00');
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${day}/${month}`;
        }
    }

    updateKPIs(data) {
        const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);
        const avgTicket = data.reduce((sum, d) => sum + d.ticket, 0) / data.length;
        const numOperations = data.reduce((sum, d) => sum + d.numOperations, 0);
        const maxVolume = Math.max(...data.map(d => d.volume));

        const totalVolumeEl = document.getElementById('totalVolume');
        const avgTicketEl = document.getElementById('avgTicket');
        const numOperationsEl = document.getElementById('numOperations');
        const maxVolumeEl = document.getElementById('maxVolume');

        if (totalVolumeEl) totalVolumeEl.textContent = this.formatCurrency(totalVolume);
        if (avgTicketEl) avgTicketEl.textContent = this.formatCurrency(avgTicket);
        if (numOperationsEl) numOperationsEl.textContent = this.formatNumber(numOperations);
        if (maxVolumeEl) maxVolumeEl.textContent = this.formatCurrency(maxVolume);
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatNumber(value) {
        return new Intl.NumberFormat('pt-BR').format(Math.round(value));
    }

    formatCurrencyShort(value) {
        if (value >= 1000000) {
            return 'R$ ' + (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return 'R$ ' + (value / 1000).toFixed(1) + 'K';
        }
        return this.formatCurrency(value);
    }

    updateChart(data, periodType) {
        const ctx = document.getElementById('volumeChart');
        if (!ctx) return;

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: data.map(d => d.dateFormatted),
                datasets: [
                    {
                        label: 'Volume',
                        data: data.map(d => d.volume),
                        borderColor: 'var(--primary)',
                        backgroundColor: 'rgba(187, 89, 39, 0.1)',
                        tension: 0.1,
                        yAxisID: 'y',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: 'var(--primary)'
                    },
                    {
                        label: 'Ticket Médio',
                        data: data.map(d => d.ticket),
                        borderColor: 'var(--blue)',
                        backgroundColor: 'rgba(27, 77, 107, 0.1)',
                        tension: 0.1,
                        yAxisID: 'y1',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: 'var(--blue)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'var(--white)',
                        titleColor: 'var(--black)',
                        bodyColor: 'var(--black)',
                        borderColor: 'var(--input-border)',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += this.formatCurrency(context.parsed.y);
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: periodType === 'daily' ? 45 : 0,
                            minRotation: periodType === 'daily' ? 45 : 0
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        ticks: {
                            callback: (value) => this.formatCurrencyShort(value)
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            callback: (value) => this.formatCurrencyShort(value)
                        }
                    }
                }
            }
        });
    }
}

const volumeOpsInstance = new VolumeOperations();
window.VolumeOperations = volumeOpsInstance;
