class VolumeChart {
    constructor() {
        this.chart = null;
        this.startDateInput = document.getElementById('startDate');
        this.endDateInput = document.getElementById('endDate');
        this.filterButton = document.getElementById('filterButton');
        this.typeSelect = document.getElementById('typeSelect');
    }

    async init() {
        this.filterButton.addEventListener('click', async () => {
            const start_date = this.startDateInput.value;
            const end_date = this.endDateInput.value;
            const type = this.typeSelect.value;
            if (start_date && end_date) {
                const data = await this.fetchVolumeData(start_date, end_date, type);
                this.renderChart(data, type);
            } else {
                alert('Por favor, selecione ambas as datas.');
            }
        });

        const endDate = new Date();
        const startDate = dateUtils.subtractMonthsFromDate(endDate, 1);

        this.startDateInput.value = dateUtils.formatDateToPattern(startDate, 'yyyy-MM-01');
        this.endDateInput.value = dateUtils.formatDateToPattern(endDate, 'yyyy-MM-01');
        this.typeSelect.value = 'daily';

        const data = await this.fetchVolumeData(
            this.startDateInput.value,
            this.endDateInput.value,
            this.typeSelect.value
        );

        this.renderChart(data, this.typeSelect.value);
    }

    async fetchVolumeData(start_date, end_date, type = 'monthly') {
        try {
            const response = await fetch(`/dashboard/volume-data?start_date=${start_date}&end_date=${end_date}&type=${type}`);
            if (!response.ok) throw new Error('Erro ao buscar dados do volume');
            const result = await response.json();
            return result.data.filter(item => {
                const date = dateUtils.convertISOToDate(item.date);
                return date >= dateUtils.convertISOToDate(start_date) && date <= dateUtils.convertISOToDate(end_date);
            });
        } catch (error) {
            console.error('Erro ao buscar dados do volume:', error);
            return [];
        }
    }

    renderChart(data, type) {
        const ctx = document.getElementById('volumeChart').getContext('2d');

        const labels = data.map(item => {
            const date = dateUtils.convertISOToDate(item.date);
            return type === 'daily'
                ? dateUtils.formatDateToPattern(date, 'dd/MMM')
                : dateUtils.getPortugueseMonthAbbreviation(date);
        });

        const values = data.map(item => (item.total_volume / 1_000_000).toFixed(2));

        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-1');
        const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-1');
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text');
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--input-border');
        const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family');

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Volume Operado (R$)',
                    data: values,
                    borderColor,
                    fill: false,
                    tension: 0,
                    pointRadius: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: type === 'daily' ? 'Dia' : 'Mês',
                            color: textColor,
                            font: {
                                family: fontFamily.trim(),
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                family: fontFamily.trim(),
                                size: 13
                            }
                        },
                        grid: { color: gridColor }
                    },
                    y: {
                        min: 0,
                        title: {
                            display: true,
                            text: 'Volume Operado (R$)',
                            color: textColor,
                            font: {
                                family: fontFamily.trim(),
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: value => `${value}M`,
                            color: textColor,
                            font: {
                                family: fontFamily.trim(),
                                size: 13
                            }
                        },
                        grid: { color: gridColor }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: context => `R$ ${context.raw}M`
                        }
                    }
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const volumeChart = new VolumeChart();
    volumeChart.init();
});
