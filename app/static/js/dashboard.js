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
        const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim();

        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Volume Operado (R$)',
                        data: volumeValues,
                        borderColor,
                        backgroundColor: borderColor,
                        yAxisID: 'y',
                        fill: false,
                        tension: 0,
                        pointRadius: 1
                    },
                    {
                        label: 'Ticket Médio (R$)',
                        data: ticketValues,
                        borderColor: avgColor,
                        backgroundColor: avgColor,
                        yAxisID: 'y1',
                        fill: false,
                        tension: 0,
                        pointRadius: 1
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
                            font: { family: fontFamily, size: 14, weight: 'bold' }
                        },
                        ticks: { color: textColor, font: { family: fontFamily, size: 13 } },
                        grid: { color: gridColor }
                    },
                    y: {
                        position: 'left',
                        min: 0,
                        title: { display: true, text: 'Volume (R$)', color: textColor, font: { family: fontFamily, size: 14, weight: 'bold' } },
                        ticks: {
                            callback: value => `${value}M`,
                            color: textColor,
                            font: { family: fontFamily, size: 13 }
                        },
                        grid: { color: gridColor }
                    },
                    y1: {
                        position: 'right',
                        min: 0,
                        title: { display: true, text: 'Ticket Médio (R$)', color: textColor, font: { family: fontFamily, size: 14, weight: 'bold' } },
                        ticks: {
                            callback: value => `${Number(value).toLocaleString('pt-BR')}`,
                            color: textColor,
                            font: { family: fontFamily, size: 13 }
                        },
                        grid: { drawOnChartArea: false }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            color: textColor,
                            font: { family: fontFamily, size: 13 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: context => {
                                const label = context.dataset.label || '';
                                const raw = context.raw;
                                if (context.dataset.yAxisID === 'y') {
                                    return `${label}: ${raw}M`;
                                } else {
                                    return `${label}: ${Number(raw).toLocaleString('pt-BR')}`;
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    renderCharts(data) {
        const overdueDocumentPercent = data.open_documents > 0
            ? (data.overdue_documents / data.open_documents) * 100
            : 0;

        const overdueValuePercent = data.open_value > 0
            ? (data.overdue_value / data.open_value) * 100
            : 0;

        const ctxDocumentCount = document.getElementById('documentCountChart').getContext('2d');
        const ctxDocumentValue = document.getElementById('documentValueChart').getContext('2d');

        if (this.documentCountChart) this.documentCountChart.destroy();
        if (this.documentValueChart) this.documentValueChart.destroy();

        const totalColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-1').trim();
        const overdueColor = getComputedStyle(document.documentElement).getPropertyValue('--error-text').trim();
        const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim();

        const createCenterTextPlugin = (percent, color) => ({
            id: 'centerText',
            beforeDraw(chart) {
                const width = chart.width;
                const height = chart.height;
                const ctx = chart.ctx;
                ctx.save();
                const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim();
                ctx.font = `bold 24px ${fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = color;
                const value = Number(percent) || 0;
                const text = `${value.toFixed(1)}%`;
                ctx.fillText(text, width / 2, height / 2);
                ctx.restore();
            },
        });

        this.documentCountChart = new Chart(ctxDocumentCount, {
            type: 'doughnut',
            data: {
                labels: ['Vencido', 'Em Dia'],
                datasets: [
                    {
                        data: [overdueDocumentPercent, 100 - overdueDocumentPercent],
                        backgroundColor: [overdueColor, totalColor],
                        borderWidth: 0,
                    },
                ],
            },
            plugins: [ createCenterTextPlugin(overdueDocumentPercent, overdueColor) ],
            options: {
                plugins: {
                    legend: {
                        display: false,
                        labels: {
                            font: { family: fontFamily }
                        }
                    }
                },
                cutout: '70%',
            },
        });

        this.documentValueChart = new Chart(ctxDocumentValue, {
            type: 'doughnut',
            data: {
                labels: ['Vencido', 'Em Dia'],
                datasets: [
                    {
                        data: [overdueValuePercent, 100 - overdueValuePercent],
                        backgroundColor: [overdueColor, totalColor],
                        borderWidth: 0,
                    },
                ],
            },
            plugins: [ createCenterTextPlugin(overdueValuePercent, overdueColor) ],
            options: {
                plugins: {
                    legend: {
                        display: false,
                        labels: {
                            font: { family: fontFamily }
                        }
                    }
                },
                cutout: '70%',
            },
        });
    }
}

class DocumentStats {
    constructor() {
        this.documentCountChart = null;
        this.documentValueChart = null;
    }

    async init() {
        const data = await this.fetchDefaultRateData();
        this.updateStats(data);
        this.renderCharts(data);
    }

    async fetchDefaultRateData() {
        try {
            const response = await fetch('/dashboard/default-rate');
            if (!response.ok) throw new Error('Erro ao buscar dados de inadimplência');
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar dados de inadimplência:', error);
            return {
                overdue_documents: 0,
                open_documents: 0,
                overdue_value: 0,
                open_value: 0,
            };
        }
    }

    updateStats(data) {
        const overdueDocumentPercent = data.open_documents > 0
            ? ((data.overdue_documents / data.open_documents) * 100).toFixed(2)
            : '0.00';

        const overdueValuePercent = data.open_value > 0
            ? ((data.overdue_value / data.open_value) * 100).toFixed(2)
            : '0.00';

        // compute "Open (Em dia)" as open - overdue
        const openDocumentsCount = Math.max(0, (data.open_documents || 0) - (data.overdue_documents || 0));
        const openValueAmount = Math.max(0, (Number(data.open_value) || 0) - (Number(data.overdue_value) || 0));

        const openDocsInput = document.getElementById('openDocuments');
         const overdueDocsInput = document.getElementById('overdueDocuments');
         const totalDocsInput = document.getElementById('totalDocuments');

         const openValueInput = document.getElementById('openValue');
         const overdueValueInput = document.getElementById('overdueValue');
         const totalValueInput = document.getElementById('totalValue');

        if (openDocsInput) openDocsInput.value = openDocumentsCount;
         if (overdueDocsInput) overdueDocsInput.value = data.overdue_documents;
         if (totalDocsInput) totalDocsInput.value = data.open_documents;

         if (openValueInput) {
            const formattedOpen = Number(openValueAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            openValueInput.value = `R$ ${formattedOpen}`;
         }
         if (overdueValueInput) {
             const formattedOverdue = Number(data.overdue_value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
             overdueValueInput.value = `R$ ${formattedOverdue}`;
         }
         if (totalValueInput) {
             const formattedTotal = Number(data.open_value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
             totalValueInput.value = `R$ ${formattedTotal}`;
         }

         // percentages remain rendered on the canvas
     }

    renderCharts(data) {
        const overdueDocumentPercent = data.open_documents > 0
            ? (data.overdue_documents / data.open_documents) * 100
            : 0;

        const overdueValuePercent = data.open_value > 0
            ? (data.overdue_value / data.open_value) * 100
            : 0;

        const ctxDocumentCount = document.getElementById('documentCountChart').getContext('2d');
        const ctxDocumentValue = document.getElementById('documentValueChart').getContext('2d');

        if (this.documentCountChart) this.documentCountChart.destroy();
        if (this.documentValueChart) this.documentValueChart.destroy();

        const totalColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-1').trim();
        const overdueColor = getComputedStyle(document.documentElement).getPropertyValue('--error-text').trim();
        const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim();

        const createCenterTextPlugin = (percent, color) => ({
            id: 'centerText',
            beforeDraw(chart) {
                const width = chart.width;
                const height = chart.height;
                const ctx = chart.ctx;
                ctx.save();
                const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim();
                // 16px * 1.5 => 24px (50% larger) and keep bold
                ctx.font = `bold 24px ${fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = color;
                const value = Number(percent) || 0;
                const text = `${value.toFixed(1)}%`;
                ctx.fillText(text, width / 2, height / 2);
                ctx.restore();
            },
        });

        this.documentCountChart = new Chart(ctxDocumentCount, {
            type: 'doughnut',
            data: {
                labels: ['Vencido', 'Em Dia'],
                datasets: [
                    {
                        data: [overdueDocumentPercent, 100 - overdueDocumentPercent],
                        backgroundColor: [overdueColor, totalColor],
                        borderWidth: 0,
                    },
                ],
            },
            plugins: [ createCenterTextPlugin(overdueDocumentPercent, overdueColor) ],
            options: {
                plugins: {
                    legend: {
                        display: false,
                        labels: {
                            font: { family: fontFamily }
                        }
                    }
                },
                cutout: '70%',
            },
        });

        this.documentValueChart = new Chart(ctxDocumentValue, {
            type: 'doughnut',
            data: {
                labels: ['Vencido', 'Em Dia'],
                datasets: [
                    {
                        data: [overdueValuePercent, 100 - overdueValuePercent],
                        backgroundColor: [overdueColor, totalColor],
                        borderWidth: 0,
                    },
                ],
            },
            plugins: [ createCenterTextPlugin(overdueValuePercent, overdueColor) ],
            options: {
                plugins: {
                    legend: {
                        display: false,
                        labels: {
                            font: { family: fontFamily }
                        }
                    }
                },
                cutout: '70%',
            },
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const volumeChart = new VolumeChart();
    await volumeChart.init();

    const documentStats = new DocumentStats();
    await documentStats.init();
});
