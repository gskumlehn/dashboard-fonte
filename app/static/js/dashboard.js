let volumeChart = null;
let currentPeriod = 'year_month'; // guarda período atual usado para formatar eixo X

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
    // agora retorna tanto labels formatados pelo backend quanto os períodos "raw"
    const formatted = rows.map(r => r.period_formatted);
    const raw = rows.map(r => r.period);
    const data = rows.map(r => Number(r.total_volume) || 0);
    return { labels: formatted, rawPeriods: raw, data };
}

// formata label do eixo X para 'jan/25' quando for year_month
function formatMonthLabelFromPeriod(periodValue) {
    // aceita formatos: 'YYYY-MM', 'YYYY-M', 'YYYYMM' ou 'YYYY-MM-DD' (usa mês)
    const monthNames = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    if (!periodValue) return '';
    // extrair ano e mês
    let y = '', m = '';
    const dashParts = String(periodValue).split('-');
    if (dashParts.length >= 2) {
        y = dashParts[0];
        m = dashParts[1].padStart(2,'0');
    } else if (/^\d{6}$/.test(periodValue)) {
        y = periodValue.substr(0,4);
        m = periodValue.substr(4,2);
    } else if (/^\d{4}\d{2}\d{2}$/.test(periodValue)) {
        y = periodValue.substr(0,4);
        m = periodValue.substr(4,2);
    } else {
        return periodValue;
    }
    const mi = parseInt(m, 10) - 1;
    const yy = y.substr(2,2);
    const mon = monthNames[mi] || m;
    return `${mon}/${yy}`;
}

// formata label do eixo X para month_day (dd/MM)
function formatDayLabelFromPeriod(periodValue) {
    // aceita 'YYYY-MM-DD' ou Date-like
    if (!periodValue) return '';
    const parts = String(periodValue).split('-');
    if (parts.length >= 3) {
        const dd = parts[2].padStart(2,'0');
        const mm = parts[1].padStart(2,'0');
        return `${dd}/${mm}`;
    }
    return periodValue;
}

function renderVolumeChart(rows) {
    const ctx = document.getElementById('volumeChart').getContext('2d');
    const chartDataObj = buildChartData(rows);

    // determine magnitude for automatic unit (none / k / M)
    const maxVal = chartDataObj.data.length ? Math.max(...chartDataObj.data.map(v => Math.abs(Number(v) || 0))) : 0;
    let unit = 1;
    let suffix = '';
    if (maxVal >= 1_000_000) {
        unit = 1_000_000;
        suffix = 'M';
    } else if (maxVal >= 1_000) {
        unit = 1_000;
        suffix = 'k';
    }

    // read colors from CSS variables (colors.css)
    const primaryColor = getCssVar('--chart-color-1', '#3b82f6');
    const textColor = getCssVar('--text', '#3d3d3d');
    const gridColor = getCssVar('--card-border', 'rgba(0,0,0,0.06)');

    const borderColor = primaryColor;
    const backgroundColor = hexToRgba(primaryColor, 0.12);
    const pointColor = primaryColor;

    // tick formatter for axis (abbreviated when unit > 1)
    function tickFormatter(value) {
        if (unit === 1) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
        }
        const v = value / unit;
        const digits = Number.isInteger(v) ? 0 : (Math.abs(v) >= 10 ? 0 : 1);
        return `${v.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: 0 })}${suffix}`;
    }

    // decide formatter do eixo X baseado no período atual e usa rawPeriods como fonte
    function xTickFormatter(value, index) {
        const raw = chartDataObj.rawPeriods[index] || value;
        if (currentPeriod === 'year_month' || currentPeriod === 'year') {
            return formatMonthLabelFromPeriod(raw);
        }
        if (currentPeriod === 'month_day' || currentPeriod === 'day') {
            return formatDayLabelFromPeriod(raw);
        }
        // default: usa formatted (labels já amigáveis)
        return chartDataObj.labels[index] || value;
    }

    const config = {
        type: 'line',
        data: {
            // usar rawPeriods como labels fonte para indexação, Chart.js mostrará o resultado do callback
            labels: chartDataObj.rawPeriods.length ? chartDataObj.rawPeriods : chartDataObj.labels,
            datasets: [{
                label: 'Volume Total',
                data: chartDataObj.data,
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
                    title: { display: false, color: textColor },
                    ticks: {
                        color: textColor,
                        callback: xTickFormatter,
                        autoSkip: true,
                        maxRotation: 90,
                        minRotation: 90,
                        align: 'center'
                    },
                    grid: { color: gridColor }
                },
                y: {
                    display: true,
                    title: { display: true, text: 'Volume (R$)', color: textColor },
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            return tickFormatter(value);
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
                    labelColor: function(context) {
                        return {
                            borderColor: getCssVar('--chart-color-1', '#3b82f6'),
                            backgroundColor: hexToRgba(getCssVar('--chart-color-1', '#3b82f6'), 1)
                        };
                    }
                }
            },
            elements: {
                line: { tension: 0.3 }
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

/* ---------- Funções de controle de filtros simplificadas ---------- */

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

/* Helpers de datas (mantidas) */
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

/* Computa período a partir dos inputs (month > year > fallback último mês) */
function computePeriodFromInputs() {
    const monthVal = document.getElementById('month-input').value; // YYYY-MM or ''
    const yearVal = document.getElementById('year-select').value; // YYYY or ''
    const today = new Date();
    let period = 'year_month';
    let start = null;
    let end = formatDateYYYYMMDD(today);

    if (monthVal) {
        // Mês específico -> agregação por dia
        const parts = monthVal.split('-');
        const y = parseInt(parts[0], 10);
        const mo = parseInt(parts[1], 10) - 1;
        const first = new Date(y, mo, 1);
        const last = new Date(y, mo + 1, 0);
        start = formatDateYYYYMMDD(first);
        end = formatDateYYYYMMDD(last);
        period = 'month_day';
    } else if (yearVal) {
        const year = parseInt(yearVal, 10);
        start = `${year}-01-01`;
        end = `${year}-12-31`;
        period = 'year_month';
    } else {
        // fallback: último mês
        const first = addMonths(today, -1);
        start = formatDateYYYYMMDD(first);
        end = formatDateYYYYMMDD(today);
        period = 'month_day';
    }

    return { period, start_date: start, end_date: end };
}

/* Aplica filtros e renderiza; aceita override opcional (period,start,end) */
async function applyFiltersAndRender(override = null) {
    let computed;
    if (override && override.period) {
        computed = {
            period: override.period,
            start_date: override.start_date || null,
            end_date: override.end_date || null
        };
    } else {
        computed = computePeriodFromInputs();
    }
    currentPeriod = computed.period || 'year_month';
    const rows = await fetchVolumeData(computed.period, computed.start_date, computed.end_date);
    renderVolumeChart(rows);
}

// Debounce helper
function debounce(fn, wait = 300) {
    let t = null;
    return function(...args) {
        if (t) clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

/* Quick buttons: aplicam override direto */
function setupQuickButtons() {
    document.getElementById('btn-last-month').addEventListener('click', async () => {
        const today = new Date();
        const start = formatDateYYYYMMDD(addMonths(today, -1));
        const end = formatDateYYYYMMDD(today);
        // clear explicit month/year inputs to reflect override
        document.getElementById('month-input').value = '';
        document.getElementById('year-select').value = '';
        await applyFiltersAndRender({ period: 'month_day', start_date: start, end_date: end });
    });
    document.getElementById('btn-last-quarter').addEventListener('click', async () => {
        const today = new Date();
        const start = formatDateYYYYMMDD(addMonths(today, -3));
        const end = formatDateYYYYMMDD(today);
        document.getElementById('month-input').value = '';
        document.getElementById('year-select').value = '';
        await applyFiltersAndRender({ period: 'quarter_week', start_date: start, end_date: end });
    });
    document.getElementById('btn-last-year').addEventListener('click', async () => {
        const today = new Date();
        const start = formatDateYYYYMMDD(addMonths(today, -12));
        const end = formatDateYYYYMMDD(today);
        document.getElementById('month-input').value = '';
        document.getElementById('year-select').value = '';
        await applyFiltersAndRender({ period: 'year_month', start_date: start, end_date: end });
    });
}

/* Inicialização */
document.addEventListener('DOMContentLoaded', async () => {
    // Setup UI controls
    populateYearSelect(5);

    // set default month input to previous month for convenience
    const today = new Date();
    const prev = addMonths(today, -1);
    const prevMonthStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('month-input').value = prevMonthStr;

    // auto apply when month or year changes (debounced)
    const autoApply = debounce(async () => { await applyFiltersAndRender(); }, 250);
    document.getElementById('month-input').addEventListener('change', autoApply);
    document.getElementById('year-select').addEventListener('change', autoApply);

    // apply button fallback
    document.getElementById('apply-filters').addEventListener('click', async () => {
        await applyFiltersAndRender();
    });

    setupQuickButtons();

    // Initial render: mês anterior (month input already set)
    await applyFiltersAndRender();
});
