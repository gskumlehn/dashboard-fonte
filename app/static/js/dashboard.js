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

/* ---------- Novas funções de controle de filtros ---------- */

function showControlsForMode(mode) {
    document.getElementById('ultimo-controls').style.display = mode === 'ultimo' ? 'inline-flex' : 'none';
    document.getElementById('mes-controls').style.display = mode === 'mes' ? 'inline-flex' : 'none';
    document.getElementById('ano-controls').style.display = mode === 'ano' ? 'inline-flex' : 'none';
}

function populateYearSelect(rangeYears = 5) {
    const sel = document.getElementById('year-select');
    sel.innerHTML = '';
    const now = new Date();
    const currentYear = now.getFullYear();
    for (let y = currentYear; y >= currentYear - rangeYears; y--) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = String(y);
        sel.appendChild(opt);
    }
}

/* Helpers de datas */
function formatDateYYYYMMDD(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function addMonths(date, months) {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    // corrigir overflow de mês
    if (d.getDate() < day) {
        d.setDate(0);
    }
    return d;
}

/* Calcula start/end para os filtros solicitados */
function computePeriodFromFilters() {
    const mode = document.getElementById('mode-select').value;
    const today = new Date();
    let period = 'year_month';
    let start = null;
    let end = formatDateYYYYMMDD(today);

    if (mode === 'ultimo') {
        const ultimo = document.getElementById('ultimo-select').value;
        if (ultimo === 'month') {
            period = 'month_day';
            start = formatDateYYYYMMDD(addMonths(today, -1));
        } else if (ultimo === 'quarter') {
            period = 'quarter_week';
            start = formatDateYYYYMMDD(addMonths(today, -3));
        } else if (ultimo === 'year') {
            period = 'year_month';
            start = formatDateYYYYMMDD(addMonths(today, -12));
        }
    } else if (mode === 'mes') {
        const m = document.getElementById('month-input').value; // YYYY-MM
        if (!m) {
            // default to current month
            const first = new Date(today.getFullYear(), today.getMonth(), 1);
            const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            start = formatDateYYYYMMDD(first);
            end = formatDateYYYYMMDD(last);
        } else {
            const parts = m.split('-');
            const y = parseInt(parts[0], 10);
            const mo = parseInt(parts[1], 10) - 1;
            const first = new Date(y, mo, 1);
            const last = new Date(y, mo + 1, 0);
            start = formatDateYYYYMMDD(first);
            end = formatDateYYYYMMDD(last);
        }
        period = 'month_day';
    } else if (mode === 'ano') {
        const y = document.getElementById('year-select').value;
        const year = y ? parseInt(y, 10) : today.getFullYear();
        start = `${year}-01-01`;
        end = `${year}-12-31`;
        period = 'year_month';
    }

    return { period, start_date: start, end_date: end };
}

/* Handler do botão aplicar */
async function applyFiltersAndRender() {
    const computed = computePeriodFromFilters();
    const rows = await fetchVolumeData(computed.period, computed.start_date, computed.end_date);
    renderVolumeChart(rows);
}

/* Quick buttons */
function setupQuickButtons() {
    document.getElementById('btn-last-month').addEventListener('click', async () => {
        document.getElementById('mode-select').value = 'ultimo';
        document.getElementById('ultimo-select').value = 'month';
        showControlsForMode('ultimo');
        await applyFiltersAndRender();
    });
    document.getElementById('btn-last-quarter').addEventListener('click', async () => {
        document.getElementById('mode-select').value = 'ultimo';
        document.getElementById('ultimo-select').value = 'quarter';
        showControlsForMode('ultimo');
        await applyFiltersAndRender();
    });
    document.getElementById('btn-last-year').addEventListener('click', async () => {
        document.getElementById('mode-select').value = 'ultimo';
        document.getElementById('ultimo-select').value = 'year';
        showControlsForMode('ultimo');
        await applyFiltersAndRender();
    });
}

/* Inicialização */
document.addEventListener('DOMContentLoaded', async () => {
    // Setup handler
    document.getElementById('apply-filters').addEventListener('click', async () => {
        await applyFiltersAndRender();
    });

    // Setup UI controls
    populateYearSelect(5);
    showControlsForMode(document.getElementById('mode-select').value);

    document.getElementById('mode-select').addEventListener('change', (e) => {
        showControlsForMode(e.target.value);
    });

    setupQuickButtons();

    // Initial render: Último mês
    document.getElementById('mode-select').value = 'ultimo';
    document.getElementById('ultimo-select').value = 'month';
    showControlsForMode('ultimo');
    await applyFiltersAndRender();
});
