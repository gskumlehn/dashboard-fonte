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
    // rows: [{ period, period_formatted, total_volume, operation_count }, ...]
    if (!rows || rows.length === 0) {
        return { labels: [], rawPeriods: [], data: [] };
    }

    // helper: parse period strings into a UTC timestamp (ms) when possible
    function periodToTimestamp(p) {
        if (!p) return null;
        // YYYY-MM-DD
        const isoDate = /^\d{4}-\d{2}-\d{2}$/;
        const yearMonth = /^\d{4}-\d{2}$/;
        const weekRaw = /^(\d{4})-(\d{2})-W(\d+)$/; // YYYY-MM-W<weekOfYear>

        if (isoDate.test(p)) {
            const parts = p.split('-').map(x => parseInt(x, 10));
            return Date.UTC(parts[0], parts[1] - 1, parts[2]);
        }
        if (yearMonth.test(p)) {
            const parts = p.split('-').map(x => parseInt(x, 10));
            return Date.UTC(parts[0], parts[1] - 1, 1);
        }
        const m = p.match(weekRaw);
        if (m) {
            const year = parseInt(m[1], 10);
            const month = parseInt(m[2], 10);
            const weekOfYear = parseInt(m[3], 10);

            // compute iso week of first day of month (UTC) and approximate week-of-month
            const firstDay = new Date(Date.UTC(year, month - 1, 1));
            const weekFirst = getISOWeekNumber(firstDay); // uses UTC internally
            let wom = weekOfYear - weekFirst + 1;
            if (wom < 1) wom = 1;
            // approximate day: first day + (wom-1)*7
            const approxDay = 1 + (wom - 1) * 7;
            // clamp to last day of month
            const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
            const day = Math.min(approxDay, lastDay);
            return Date.UTC(year, month - 1, day);
        }

        // fallback: try Date.parse safely by splitting numeric parts (last resort)
        const parsed = Date.parse(p);
        return isNaN(parsed) ? null : parsed;
    }

    // build array with timestamp keys
    const items = rows.map(r => {
        const ts = periodToTimestamp(String(r.period || ''));
        return { r, ts };
    });

    // if at least one timestamp exists, sort by ts when possible; otherwise fallback to string sort
    const hasSomeTs = items.some(it => it.ts !== null);
    if (hasSomeTs) {
        items.sort((a, b) => {
            if (a.ts === null && b.ts === null) {
                const pa = String(a.r.period || '');
                const pb = String(b.r.period || '');
                return pa.localeCompare(pb);
            }
            if (a.ts === null) return 1;
            if (b.ts === null) return -1;
            return a.ts - b.ts;
        });
    } else {
        // fallback alphabetical
        items.sort((a, b) => {
            const pa = String(a.r.period || '');
            const pb = String(b.r.period || '');
            return pa.localeCompare(pb);
        });
    }

    // produce arrays in sorted order
    const sortedRows = items.map(it => it.r);
    const formatted = sortedRows.map(r => r.period_formatted);
    const raw = sortedRows.map(r => r.period);
    const data = sortedRows.map(r => Number(r.total_volume) || 0);
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

// formata label do eixo X para month_day (dia -> apenas número)
function formatDayLabelFromPeriod(periodValue) {
    if (!periodValue) return '';
    const parts = String(periodValue).split('-');
    if (parts.length >= 3) {
        const dd = parseInt(parts[2], 10);
        return String(dd); // apenas o número do dia
    }
    // fallback: try to parse date
    const d = new Date(periodValue);
    if (!isNaN(d)) return String(d.getDate());
    return periodValue;
}

// retorna número de semana ISO para uma Date (1-53)
function getISOWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

// calcula week-of-month a partir de raw 'YYYY-MM-Ww' (w = week-of-year)
// aproximação: weekOfMonth = weekOfYear(raw) - weekOfYear(firstDayOfMonth) + 1
function weekOfMonthFromRaw(raw) {
    if (!raw) return '';
    // expected format 'YYYY-MM-W<week>'
    const m = String(raw).match(/^(\d{4})-(\d{2})-W(\d+)$/);
    if (!m) return raw;
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const weekOfYear = parseInt(m[3], 10);

    const firstDay = new Date(year, month - 1, 1);
    const weekFirst = getISOWeekNumber(firstDay);
    let wom = weekOfYear - weekFirst + 1;
    if (wom < 1) wom = 1;

    // month short names in Portuguese
    const monthNames = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    const mon = monthNames[(month - 1) % 12] || String(month);

    // return format like: "1/out"  (removed 'semana ' prefix)
    return `${wom}/${mon}`;
}

// Novo helper: converte número para ordinal em PT-BR (1 -> 'Primeira', 2 -> 'Segunda', ...)
function ordinalPortuguese(n) {
    const ord = {
        1: 'Primeira',
        2: 'Segunda',
        3: 'Terceira',
        4: 'Quarta',
        5: 'Quinta',
        6: 'Sexta'
    };
    return ord[n] || `${n}ª`;
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

    // decide labels a serem usadas no Chart:
    // - para month_day usamos os dias extraídos de rawPeriods (1..31) em ordem crescente
    let chartLabels;
    if (currentPeriod === 'month_day') {
        chartLabels = chartDataObj.rawPeriods.map(p => {
            if (!p) return '';
            const parts = String(p).split('-');
            if (parts.length >= 3) return String(parseInt(parts[2], 10)); // remove leading zeros
            return p;
        });
    } else {
        chartLabels = (chartDataObj.rawPeriods.length ? chartDataObj.rawPeriods : chartDataObj.labels);
    }

    // decide formatter do eixo X baseado no período atual and other helpers
    function xTickFormatter(value, index) {
        if (currentPeriod === 'month_day') {
            // value já é o dia (ex: "1","2",...), retornamos como está
            return String(value);
        }
        const raw = chartDataObj.rawPeriods[index] || value;
        if (currentPeriod === 'year_month' || currentPeriod === 'year') {
            return formatMonthLabelFromPeriod(raw);
        }
        if (currentPeriod === 'day') {
            return formatDayLabelFromPeriod(raw);
        }
        if (currentPeriod === 'quarter_week') {
            return weekOfMonthFromRaw(raw);
        }
        // default: usa formatted (labels já amigáveis)
        return chartDataObj.labels[index] || value;
    }

    // month full names (pt-BR)
    const monthNamesFull = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

    function capitalize(s) {
        if (!s) return s;
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    // --- ADDED: ensure typography variables are available inside renderVolumeChart ---
    const chartFontFamily = getCssVar('--font-family', getComputedStyle(document.body).fontFamily);
    const chartFontSize = parseInt(getCssVar('--chart-font-size', '13'), 10) || 13;
    const chartFontWeight = getCssVar('--chart-font-weight', '600');
    // -------------------------------------------------------------------------

    const config = {
        type: 'line',
        data: {
            labels: chartLabels,
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
                    type: 'category',
                    display: true,
                    title: {
                        display: true,
                        text: 'Mês',
                        color: textColor,
                        font: { family: chartFontFamily, size: chartFontSize, weight: chartFontWeight }
                    },
                    ticks: {
                        color: textColor,
                        callback: xTickFormatter,
                        autoSkip: true,
                        maxTicksLimit: 24,
                        maxRotation: 0,
                        minRotation: 0,
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
                    backgroundColor: getCssVar('--white', '#ffffff'),
                    borderColor: getCssVar('--card-border', 'rgba(0,0,0,0.06)'),
                    borderWidth: 1,
                    padding: 8,
                    titleColor: textColor,
                    bodyColor: textColor,
                    callbacks: {
                        // format tooltip title for different periods
                        title: function(items) {
                            if (!items || items.length === 0) return '';
                            const idx = items[0].dataIndex;
                            const raw = chartDataObj.rawPeriods[idx] || chartDataObj.labels[idx] || '';

                            if (currentPeriod === 'year_month') {
                                const parts = String(raw).split('-');
                                if (parts.length >= 2) {
                                    const y = parts[0];
                                    const m = parts[1].padStart(2, '0');
                                    const mi = parseInt(m, 10) - 1;
                                    const monthName = monthNamesFull[mi] || m;
                                    return [ `${capitalize(monthName)} de ${y}` ];
                                }
                            }

                            if (currentPeriod === 'month_day') {
                                const parts = String(raw).split('-');
                                if (parts.length >= 3) {
                                    const y = parts[0];
                                    const m = parts[1].padStart(2, '0');
                                    const d = String(parseInt(parts[2], 10));
                                    const mi = parseInt(m, 10) - 1;
                                    const monthName = monthNamesFull[mi] || m;
                                    return [ `${d} ${capitalize(monthName)} de ${y}` ];
                                }
                            }

                            if (currentPeriod === 'quarter_week') {
                                // expected raw: 'YYYY-MM-W<week>'
                                const m = String(raw).match(/^(\d{4})-(\d{2})-W(\d+)$/);
                                if (m) {
                                    const year = parseInt(m[1], 10);
                                    const month = parseInt(m[2], 10);
                                    const weekOfYear = parseInt(m[3], 10);
                                    const firstDay = new Date(year, month - 1, 1);
                                    const weekFirst = getISOWeekNumber(firstDay);
                                    let wom = weekOfYear - weekFirst + 1;
                                    if (wom < 1) wom = 1;
                                    const ordinal = ordinalPortuguese(wom);
                                    const monthName = monthNamesFull[(month - 1) % 12] || String(month);
                                    return [ `${ordinal} semana de ${capitalize(monthName)}` ];
                                }
                                // fallback: use previous compact label if parse fails
                                const wlabel = weekOfMonthFromRaw(raw);
                                return [ `Semana ${wlabel}` ];
                            }

                            return [ chartDataObj.labels[idx] || String(raw) ];
                        },
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
    sel.innerHTML = '<option value="">—</option>';
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = 2023; // start the year filter at 2023
    for (let y = currentYear; y >= startYear; y--) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = String(y);
        sel.appendChild(opt);
    }
}

function populateMonthSelect() {
    const sel = document.getElementById('month-select');
    sel.innerHTML = '<option value="">—</option>';
    const monthNames = ['01 - Jan','02 - Fev','03 - Mar','04 - Abr','05 - Mai','06 - Jun','07 - Jul','08 - Ago','09 - Set','10 - Out','11 - Nov','12 - Dez'];
    for (let i = 0; i < 12; i++) {
        const val = String(i+1).padStart(2,'0');
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = monthNames[i];
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

/* Computa período a partir dos selects (month-select > year-select > fallback último mês) */
function computePeriodFromInputs() {
    const monthVal = document.getElementById('month-select').value; // '01'..'12' or ''
    const yearVal = document.getElementById('year-select').value; // 'YYYY' or ''
    const today = new Date();
    let period = 'year_month';
    let start = null;
    let end = formatDateYYYYMMDD(today);

    if (monthVal && yearVal) {
        const y = parseInt(yearVal, 10);
        const mo = parseInt(monthVal, 10) - 1;
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
    const monthSel = document.getElementById('month-select');
    const yearSel = document.getElementById('year-select');

    document.getElementById('btn-last-month').addEventListener('click', async () => {
        const today = new Date();
        const start = formatDateYYYYMMDD(addMonths(today, -1));
        const end = formatDateYYYYMMDD(today);
        yearSel.value = '';
        monthSel.value = '';
        monthSel.disabled = true;
        monthSel.style.opacity = '0.6';
        await applyFiltersAndRender({ period: 'month_day', start_date: start, end_date: end });
    });
    document.getElementById('btn-last-quarter').addEventListener('click', async () => {
        const today = new Date();
        const start = formatDateYYYYMMDD(addMonths(today, -3));
        const end = formatDateYYYYMMDD(today);
        yearSel.value = '';
        monthSel.value = '';
        monthSel.disabled = true;
        monthSel.style.opacity = '0.6';
        await applyFiltersAndRender({ period: 'quarter_week', start_date: start, end_date: end });
    });
    document.getElementById('btn-last-year').addEventListener('click', async () => {
        const today = new Date();
        const start = formatDateYYYYMMDD(addMonths(today, -12));
        const end = formatDateYYYYMMDD(today);
        yearSel.value = '';
        monthSel.value = '';
        monthSel.disabled = true;
        monthSel.style.opacity = '0.6';
        await applyFiltersAndRender({ period: 'year_month', start_date: start, end_date: end });
    });
}

/* Inicialização */
document.addEventListener('DOMContentLoaded', async () => {
    // apply chart typography from CSS variables
    const chartFontFamily = getCssVar('--font-family', getComputedStyle(document.body).fontFamily);
    const chartFontSize = parseInt(getCssVar('--chart-font-size', '13'), 10) || 13;
    const chartFontWeight = getCssVar('--chart-font-weight', '600');
    const chartColor = getCssVar('--text', '#3d3d3d');

    if (window.Chart) {
        Chart.defaults.font.family = chartFontFamily;
        Chart.defaults.font.size = chartFontSize;
        Chart.defaults.font.weight = chartFontWeight;
        Chart.defaults.color = chartColor;
        // ensure legend/tooltips inherit color
        if (Chart.defaults.plugins && Chart.defaults.plugins.legend) {
            Chart.defaults.plugins.legend.labels = Chart.defaults.plugins.legend.labels || {};
            Chart.defaults.plugins.legend.labels.color = chartColor;
            Chart.defaults.plugins.legend.labels.font = { family: chartFontFamily, size: chartFontSize, weight: chartFontWeight };
        }
        if (Chart.defaults.plugins && Chart.defaults.plugins.tooltip) {
            Chart.defaults.plugins.tooltip.titleColor = chartColor;
            Chart.defaults.plugins.tooltip.bodyColor = chartColor;
            Chart.defaults.plugins.tooltip.titleFont = { family: chartFontFamily, size: chartFontSize, weight: chartFontWeight };
            Chart.defaults.plugins.tooltip.bodyFont = { family: chartFontFamily, size: chartFontSize, weight: chartFontWeight };
        }
    }

    // Setup UI controls
    populateYearSelect(5);
    populateMonthSelect();

    const monthSel = document.getElementById('month-select');
    const yearSel = document.getElementById('year-select');

    // set default selects: no year selected, month disabled (visible but with lower opacity)
    yearSel.value = '';
    monthSel.value = '';
    monthSel.disabled = true;
    monthSel.style.opacity = '0.6';

    // auto apply when year or month changes (debounced)
    const autoApply = debounce(async () => { await applyFiltersAndRender(); }, 250);
    yearSel.addEventListener('change', async (e) => {
        const y = e.target.value;
        if (y) {
            monthSel.disabled = false;
            monthSel.style.opacity = '1';
        } else {
            monthSel.value = '';
            monthSel.disabled = true;
            monthSel.style.opacity = '0.6';
        }
        autoApply();
    });
    monthSel.addEventListener('change', autoApply);

    setupQuickButtons();

    // Initial render: mês anterior (simulate quick last month)
    const today = new Date();
    const start = formatDateYYYYMMDD(addMonths(today, -1));
    const end = formatDateYYYYMMDD(today);
    // keep month select disabled in UI since this is a quick override
    monthSel.value = '';
    monthSel.disabled = true;
    monthSel.style.opacity = '0.6';
    await applyFiltersAndRender({ period: 'month_day', start_date: start, end_date: end });
});
