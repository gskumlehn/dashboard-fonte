class VolumeChart {
    constructor() {
        this.chart = null;
    }

    async init() {
        // Determinar o intervalo de datas
        const endDate = new Date(); // Mês atual
        const startDate = dateUtils.subtractMonthsFromDate(endDate, 12); // Últimos 12 meses

        // Formatar as datas no formato ISO (yyyy-MM-dd)
        const start_date = dateUtils.formatDateToPattern(startDate, 'yyyy-MM-dd');
        const end_date = dateUtils.formatDateToPattern(endDate, 'yyyy-MM-dd');

        // Buscar dados do backend
        const data = await this.fetchVolumeData(start_date, end_date);

        // Configurar o gráfico
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
        const transparentBackgroundColor = backgroundColor.replace(')', ', 0.1)').replace('rgb', 'rgba'); // Adicionar transparência
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
                    backgroundColor: transparentBackgroundColor, // Usar cor com transparência
                    fill: true, // Preencher área abaixo da linha
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
                            text: 'Mês',
                            color: textColor,
                            font: {
                                family: fontFamily.trim(),
                                size: 14
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
                        min: 0, // Sempre começar do 0
                        title: {
                            display: true,
                            text: 'Volume Operado (R$)',
                            color: textColor,
                            font: {
                                family: fontFamily.trim(),
                                size: 14
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
                    tooltip: {
                        callbacks: {
                            label: context => `R$ ${context.raw}M` // Tooltip formatado
                        }
                    }
                }
            }
        });
    }
}

// Inicializar o gráfico automaticamente ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const volumeChart = new VolumeChart();
    volumeChart.init();
});
