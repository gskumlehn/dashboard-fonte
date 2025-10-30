import dateUtils from './utils/dateUtils.js';

const volumeChart = {
    chart: null,

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
    },

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
    },

    renderChart(data) {
        const ctx = document.getElementById('volumeChart').getContext('2d');

        // Preparar os dados para o gráfico
        const labels = data.map(item => {
            const date = dateUtils.convertISOToDate(`${item.date}-01`); // Adicionar dia fictício para parsing
            return dateUtils.getPortugueseMonthAbbreviation(date); // Meses em português reduzido
        });

        const values = data.map(item => (item.total_volume / 1_000_000).toFixed(2)); // Escala em milhões

        // Obter cores e fonte das variáveis CSS
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-1') || '#c67440';
        const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-1') || 'rgba(198, 116, 64, 0.1)';
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text') || '#3d3d3d';
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--input-border') || '#e0e0e0';
        const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family') || '"Source Sans Pro", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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
                    },
                    legend: {
                        labels: {
                            color: textColor,
                            font: {
                                family: fontFamily.trim(),
                                size: 14
                            }
                        }
                    }
                }
            }
        });
    }
};

// Inicializar o gráfico ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    volumeChart.init();
});
