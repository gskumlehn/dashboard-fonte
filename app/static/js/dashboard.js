class VolumeChart {
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
                const data = await this.fetchVolumeData(start_date, end_date);
                this.renderChart(data);
            } else {
                alert('Por favor, selecione ambas as datas.');
            }
        });

        // Carregar gráfico inicial com os últimos 12 meses
        const endDate = new Date(); // Mês atual
        const startDate = dateUtils.subtractMonthsFromDate(endDate, 12); // Últimos 12 meses

        this.startDateInput.value = dateUtils.formatDateToPattern(startDate, 'yyyy-MM-01'); // Primeiro dia do mês
        this.endDateInput.value = dateUtils.formatDateToPattern(endDate, 'yyyy-MM-01'); // Primeiro dia do mês atual

        const data = await this.fetchVolumeData(
            this.startDateInput.value,
            this.endDateInput.value
        );

        this.renderChart(data);
    }

    async fetchVolumeData(start_date, end_date) {
        try {
            const response = await fetch(`/dashboard/volume-data?start_date=${start_date}&end_date=${end_date}`);
            if (!response.ok) throw new Error('Erro ao buscar dados do volume');
            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error('Erro ao buscar dados do volume:', error);
            return [];
        }
    }

    renderChart(data) {
        const ctx = document.getElementById('volumeChart').getContext('2d');

        // Preparar os dados para o gráfico
        const labels = data.map(item => {
            const date = dateUtils.convertISOToDate(`${item.date}-01`); // Adicionar dia fictício para parsing
            return dateUtils.getPortugueseMonthAbbreviation(date); // Meses em português reduzido
        });

        const values = data.map(item => (item.total_volume / 1_000_000).toFixed(2)); // Escala em milhões

        // Obter cores e fonte das variáveis CSS
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-1');
        const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-1');
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
                            text: 'Mês',
                            color: textColor,
                            font: {
                                family: fontFamily.trim(),
                                size: 14,
                                weight: 'bold' // Legenda em negrito
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
                                weight: 'bold' // Legenda em negrito
                            }
                        },
                        ticks: {
                            callback: value => `${value}M`, // Formatar em milhões
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
