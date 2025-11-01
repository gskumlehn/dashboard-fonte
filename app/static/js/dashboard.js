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
            return result.data || [];
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

        const volumeValues = data.map(item => Number((item.total_volume / 1_000_000).toFixed(2)));
        const ticketValues = data.map(item => Number(Number(item.average_ticket).toFixed(2)));

        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-1');
        const avgColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-5'); // Cinza
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text');
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--input-border');
        const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family');

        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Volume Operado (M R$)',
                        data: volumeValues,
                        borderColor,
                        backgroundColor: borderColor,
                        yAxisID: 'y',
                        fill: false,
                        tension: 0,
                        pointRadius: 2
                    },
                    {
                        label: 'Ticket Médio (R$)',
                        data: ticketValues,
                        borderColor: avgColor,
                        backgroundColor: avgColor,
                        yAxisID: 'y1',
                        fill: false,
                        tension: 0.2,
                        pointRadius: 2
                    }
                ]
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
                            font: { family: fontFamily.trim(), size: 14, weight: 'bold' }
                        },
                        ticks: { color: textColor, font: { family: fontFamily.trim(), size: 13 } },
                        grid: { color: gridColor }
                    },
                    y: {
                        position: 'left',
                        min: 0,
                        title: { display: true, text: 'Volume (M R$)', color: textColor, font: { family: fontFamily.trim(), size: 14, weight: 'bold' } },
                        ticks: {
                            callback: value => `${value}M`,
                            color: textColor,
                            font: { family: fontFamily.trim(), size: 13 }
                        },
                        grid: { color: gridColor }
                    },
                    y1: {
                        position: 'right',
                        min: 0,
                        title: { display: true, text: 'Ticket Médio (R$)', color: textColor, font: { family: fontFamily.trim(), size: 14, weight: 'bold' } },
                        ticks: {
                            callback: value => `R$ ${Number(value).toLocaleString('pt-BR')}`,
                            color: textColor,
                            font: { family: fontFamily.trim(), size: 13 }
                        },
                        grid: { drawOnChartArea: false }
                    }
                },
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: context => {
                                const label = context.dataset.label || '';
                                const raw = context.raw;
                                if (context.dataset.yAxisID === 'y') {
                                    return `${label}: ${raw}M`;
                                } else {
                                    return `${label}: R$ ${Number(raw).toLocaleString('pt-BR')}`;
                                }
                            }
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
