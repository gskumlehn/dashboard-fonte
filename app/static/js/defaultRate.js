class DefaultRateChart {
    constructor() {
        this.chart = null;
        this.startDateInput = document.getElementById('startDate');
        this.endDateInput = document.getElementById('endDate');
        this.filterButton = document.getElementById('filterButton');
    }

    async init() {
        // Configurar evento de filtro
        this.filterButton.addEventListener('click', async () => {
            const start_date = this.startDateInput.value;
            const end_date = this.endDateInput.value;
            if (start_date && end_date) {
                const data = await this.fetchDefaultRateData(start_date, end_date);
                this.renderChart(data);
            } else {
                alert('Por favor, selecione ambas as datas.');
            }
        });

        // Carregar gráfico inicial com os últimos 30 dias
        const endDate = new Date(); // Data atual
        const startDate = dateUtils.subtractMonthsFromDate(endDate, 1); // Últimos 30 dias

        this.startDateInput.value = dateUtils.formatDateToPattern(startDate, 'yyyy-MM-dd');
        this.endDateInput.value = dateUtils.formatDateToPattern(endDate, 'yyyy-MM-dd');

        const data = await this.fetchDefaultRateData(
            this.startDateInput.value,
            this.endDateInput.value
        );

        this.renderChart(data);
    }

    async fetchDefaultRateData(start_date, end_date) {
        try {
            const response = await fetch(`/default-rate/data?start_date=${start_date}&end_date=${end_date}`);
            if (!response.ok) throw new Error('Erro ao buscar dados de inadimplência');
            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error('Erro ao buscar dados de inadimplência:', error);
            return [];
        }
    }

    renderChart(data) {
        const ctx = document.getElementById('defaultRateChart').getContext('2d');

        // Preparar os dados para o gráfico
        const labels = data.map(item => dateUtils.formatDateToPattern(new Date(item.date), 'dd/MM/yyyy'));
        const values = data.map(item => item.default_rate);

        // Obter cores e fonte das variáveis CSS
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-2');
        const backgroundColor = borderColor.replace(')', ', 0.1)').replace('rgb', 'rgba');
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text');
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--input-border');
        const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family');

        // Configurar o gráfico
        if (this.chart) {
            this.chart.destroy(); // Destruir gráfico anterior, se existir
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Taxa de Inadimplência (%)',
                    data: values,
                    borderColor,
                    backgroundColor,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3
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
                            text: 'Data',
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
                            text: 'Taxa de Inadimplência (%)',
                            color: textColor,
                            font: {
                                family: fontFamily.trim(),
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: value => `${value}%`,
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
                            label: context => `${context.raw}%`
                        }
                    }
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const defaultRateChart = new DefaultRateChart();
    defaultRateChart.init();
});

