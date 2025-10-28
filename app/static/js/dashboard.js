let volumeChart = null;

function getCssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return v ? v.trim() : fallback;
}

function hexToRgba(hex, alpha = 1) {
    if (!hex) return `rgba(59,130,246,${alpha})`;
    let h = hex.replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
    const int = parseInt(h, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

async function fetchVolumeData(period = 'year_month', start_date = null, end_date = null) {
    const loader = document.getElementById('chart-loader');
    const errorEl = document.getElementById('chart-error');
    loader.style.display = 'block';
    errorEl.style.display = 'none';
    try {
        const params = new URLSearchParams();
        params.append('period', period);
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);

        const resp = await fetch(`/dashboard/volume-data?${params.toString()}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const payload = await resp.json();
        return payload.data || [];
    } catch (err) {
        errorEl.textContent = `Erro ao carregar dados: ${err.message}`;
        errorEl.style.display = 'block';
        return [];
    } finally {
        loader.style.display = 'none';
    }
}

function buildChartData(rows) {
    const labels = rows.map(r => r.period_formatted);
    const data = rows.map(r => Number(r.total_volume) || 0);
    return { labels, data };
}

function renderVolumeChart(rows) {
    const ctx = document.getElementById('volumeChart').getContext('2d');
    const chartData = buildChartData(rows);

    // read colors from CSS variables (colors.css)
    const primaryColor = getCssVar('--chart-color-1', '#3b82f6');
    const secondaryColor = getCssVar('--chart-color-2', '#31708f');
    const textColor = getCssVar('--text', '#3d3d3d');
    const gridColor = getCssVar('--card-border', 'rgba(0,0,0,0.06)');

    const borderColor = primaryColor;
    const backgroundColor = hexToRgba(primaryColor, 0.12);
    const pointColor = primaryColor;

    const config = {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Volume Total',
                data: chartData.data,
                borderColor: borderColor,
                backgroundColor: backgroundColor,
                fill: true,
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: pointColor,
                pointBorderColor: pointColor
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: { display: false },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                y: {
                    display: true,
                    title: { display: true, text: 'Volume (R$)', color: textColor },
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
                        }
                    },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: {
                    display: false,
                    labels: { color: textColor }
                },
                tooltip: {
                    titleColor: textColor,
                    bodyColor: textColor,
                    callbacks: {
                        label: function(context) {
                            const val = context.parsed.y || 0;
                            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
                        }
                    },
                    // small colored box in tooltip uses labelColor callback
                    labelColor: function(context) {
                        return {
                            borderColor: getCssVar('--chart-color-1', '#3b82f6'),
                            backgroundColor: hexToRgba(getCssVar('--chart-color-1', '#3b82f6'), 1)
                        };
                    }
                }
            }
        }
    };

    if (volumeChart) {
        volumeChart.data.labels = config.data.labels;
        volumeChart.data.datasets = config.data.datasets;
        volumeChart.options = config.options;
        volumeChart.update();
    } else {
        volumeChart = new Chart(ctx, config);
    }
}

async function applyFiltersAndRender() {
    const period = document.getElementById('period-select').value;
    const start_date = document.getElementById('start-date').value || null;
    const end_date = document.getElementById('end-date').value || null;
    const rows = await fetchVolumeData(period, start_date, end_date);
    renderVolumeChart(rows);
}

document.addEventListener('DOMContentLoaded', async () => {
    // Setup handler
    document.getElementById('apply-filters').addEventListener('click', async () => {
        await applyFiltersAndRender();
    });

    // Initial render (default: year_month)
    await applyFiltersAndRender();
});
