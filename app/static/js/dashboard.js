// --- Variáveis globais ---
let volumeChart = null;
let currentPeriod = 'year_month'; // Período atual usado para formatar o eixo X

// --- Funções utilitárias ---
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

function tickFormatter(value) {
    // Formata os valores do eixo Y como moeda brasileira, com abreviação para milhões
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

// --- Funções de manipulação de dados ---
async function fetchVolumeData(period = 'year_month', start_date = null, end_date = null) {
    const loader = document.getElementById('chart-loader');
    const errorEl = document.getElementById('chart-error');
    loader.style.display = 'block';
    errorEl.style.display = 'none';
    try {
        const params = new URLSearchParams({ period });
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
    if (!rows || rows.length === 0) {
        return { labels: [], rawPeriods: [], data: [] };
    }

    const items = rows.map(r => {
        const ts = DateUtils.periodToTimestamp(String(r.period || ''));
        return { r, ts };
    });

    items.sort((a, b) => {
        if (a.ts === null && b.ts === null) {
            return String(a.r.period || '').localeCompare(String(b.r.period || ''));
        }
        if (a.ts === null) return 1;
        if (b.ts === null) return -1;
        return a.ts - b.ts;
    });

    const sortedRows = items.map(it => it.r);
    return {
        labels: sortedRows.map(r => r.period_formatted),
        rawPeriods: sortedRows.map(r => r.period),
        data: sortedRows.map(r => Number(r.total_volume) || 0)
    };
}

// --- Funções de renderização do gráfico ---
function renderVolumeChart(rows) {
    const ctx = document.getElementById('volumeChart').getContext('2d');
    const chartDataObj = buildChartData(rows);

    let chartLabels, chartValues, chartRawPeriods;

    // Definir cores do gráfico
    const borderColor = getCssVar('--chart-color-1', '#3b82f6');
    const backgroundColor = hexToRgba(borderColor, 0.1);
    const pointColor = borderColor;
    const textColor = getCssVar('--text', '#3d3d3d');
    const gridColor = getCssVar('--grid-color', 'rgba(0, 0, 0, 0.1)');

    if (currentPeriod === 'month_day') {
        const mapVal = {};
        chartDataObj.rawPeriods.forEach((d, i) => {
            if (d) mapVal[d] = chartDataObj.data[i];
        });

        const timestamps = chartDataObj.rawPeriods
            .map(p => DateUtils.periodToTimestamp(p))
            .filter(ts => ts !== null)
            .sort((a, b) => a - b);

        if (timestamps.length === 0) {
            chartLabels = [];
            chartValues = [];
            chartRawPeriods = [];
        } else {
            const minTs = timestamps[0];
            const maxTs = timestamps[timestamps.length - 1];

            const dayLabels = [];
            const values = [];
            const rawDates = [];
            let cur = new Date(minTs);
            const end = new Date(maxTs);

            while (cur <= end) {
                const dateStr = DateUtils.formatDateYYYYMMDD(cur);
                const dayNum = String(cur.getUTCDate());
                dayLabels.push(dayNum);
                values.push(mapVal[dateStr] || 0);
                rawDates.push(dateStr);
                cur.setUTCDate(cur.getUTCDate() + 1);
            }

            chartLabels = dayLabels;
            chartValues = values;
            chartRawPeriods = rawDates;
        }
    } else if (currentPeriod === 'quarter_week') {
        chartLabels = chartDataObj.rawPeriods.map(DateUtils.weekOfMonthFromRaw);
        chartValues = chartDataObj.data;
        chartRawPeriods = chartDataObj.rawPeriods.slice();
    } else {
        chartLabels = chartDataObj.labels;
        chartValues = chartDataObj.data;
        chartRawPeriods = chartDataObj.rawPeriods.slice();
    }

    function xTickFormatter(value, index) {
        if (currentPeriod === 'month_day') return String(value);
        if (currentPeriod === 'quarter_week') return chartLabels[index];
        return chartDataObj.labels[index] || value;
    }

    const config = {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Volume Total',
                data: chartValues,
                borderColor,
                backgroundColor,
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
                    type: 'category',
                    ticks: { color: textColor, callback: xTickFormatter },
                    grid: { color: gridColor }
                },
                y: {
                    ticks: { color: textColor, callback: tickFormatter },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => tickFormatter(context.parsed.y)
                    }
                }
            }
        }
    };

    if (volumeChart) {
        volumeChart.data = config.data;
        volumeChart.options = config.options;
        volumeChart.update();
    } else {
        volumeChart = new Chart(ctx, config);
    }
}

// --- Funções de controle de filtros ---
function computePeriodFromInputs() {
    const monthVal = document.getElementById('month-select').value;
    const yearVal = document.getElementById('year-select').value;
    const today = new Date();
    let period = 'year_month';
    let start = null;
    let end = DateUtils.formatDateYYYYMMDD(today);

    if (monthVal && yearVal) {
        const y = parseInt(yearVal, 10);
        const mo = parseInt(monthVal, 10) - 1;
        const first = new Date(y, mo, 1);
        const last = new Date(y, mo + 1, 0);
        start = DateUtils.formatDateYYYYMMDD(first);
        end = DateUtils.formatDateYYYYMMDD(last);
        period = 'month_day';
    } else if (yearVal) {
        const year = parseInt(yearVal, 10);
        start = `${year}-01-01`;
        end = `${year}-12-31`;
        period = 'year_month';
    } else {
        const first = DateUtils.addMonths(today, -1);
        start = DateUtils.formatDateYYYYMMDD(first);
        end = DateUtils.formatDateYYYYMMDD(today);
        period = 'month_day';
    }

    return { period, start_date: start, end_date: end };
}

async function applyFiltersAndRender(override = null) {
    const computed = override || computePeriodFromInputs();
    currentPeriod = computed.period || 'year_month';
    const rows = await fetchVolumeData(computed.period, computed.start_date, computed.end_date);
    renderVolumeChart(rows);
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
    populateYearSelect(5);
    populateMonthSelect();
    setupQuickButtons();
    await applyFiltersAndRender();
});
