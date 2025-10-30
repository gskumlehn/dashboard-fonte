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
/**
 * Função responsável por buscar os dados de volume para o gráfico.
 * @param {string} period - O período do filtro (ex.: 'year_month', 'month_day', etc.).
 * @param {string|null} start_date - Data inicial do filtro no formato 'YYYY-MM-DD'.
 * @param {string|null} end_date - Data final do filtro no formato 'YYYY-MM-DD'.
 * @returns {Promise<Array>} - Retorna uma lista de objetos contendo os dados formatados.
 */
async function fetchVolumeData(period = 'year_month', start_date = null, end_date = null) {
    // Exibe o loader enquanto os dados estão sendo carregados
    const loader = document.getElementById('chart-loader');
    const errorEl = document.getElementById('chart-error');
    loader.style.display = 'block';
    errorEl.style.display = 'none';

    try {
        // Monta os parâmetros da URL com base no período e nas datas fornecidas
        const params = new URLSearchParams({ period });
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);

        // Faz a requisição para a API com os parâmetros fornecidos
        const resp = await fetch(`/dashboard/volume-data?${params.toString()}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`); // Lança erro se a resposta não for bem-sucedida

        // Converte a resposta para JSON
        const payload = await resp.json();

        // Inicializa os dados recebidos ou uma lista vazia
        let sortedData = payload.data || [];

        // Ordena os dados apenas se o período for 'month_day'
        if (period === 'month_day') {
            sortedData = sortedData.sort((a, b) => {
                // Converte as datas do campo 'period_formatted' para objetos Date
                const dateA = new Date(a.period_formatted);
                const dateB = new Date(b.period_formatted);
                // Ordena em ordem crescente com base nas datas
                return dateA - dateB;
            });
        }

        // Retorna os dados ordenados ou originais
        return sortedData;
    } catch (err) {
        // Exibe a mensagem de erro no elemento de erro
        errorEl.textContent = `Erro ao carregar dados: ${err.message}`;
        errorEl.style.display = 'block';
        return []; // Retorna uma lista vazia em caso de erro
    } finally {
        // Oculta o loader após a conclusão da requisição
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
        const raw = chartRawPeriods[index] || value;
        if (currentPeriod === 'month_day') {
            const date = new Date(DateUtils.periodToTimestamp(raw));
            const day = date.getUTCDate();
            const month = DateUtils.monthNamesFull[date.getUTCMonth()];
            const year = date.getUTCFullYear();
            return `${day} de ${month} de ${year}`;
        }
        if (currentPeriod === 'quarter_week') {
            return DateUtils.weekOfMonthFromRaw(raw);
        }
        if (currentPeriod === 'year_month') {
            const parts = raw.split('-');
            const year = parts[0];
            const month = DateUtils.monthNamesFull[parseInt(parts[1], 10) - 1];
            return `${month} de ${year}`;
        }
        return value;
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
                    title: {
                        display: true,
                        text: currentPeriod === 'month_day' ? 'Dias' : (currentPeriod === 'quarter_week' ? 'Semanas' : 'Meses'),
                        color: textColor,
                        font: { family: getCssVar('--font-family', 'Arial'), size: 14, weight: 'bold' }
                    },
                    ticks: { color: textColor, callback: xTickFormatter },
                    grid: { color: gridColor }
                },
                y: {
                    // Forçar o eixo Y a sempre começar em 0 para padronizar o gráfico de volume
                    min: 0,
                    ticks: {
                        color: textColor,
                        callback: tickFormatter,
                        beginAtZero: true
                    },
                    title: {
                        display: true,
                        text: 'Volume (R$)',
                        color: textColor,
                        font: { family: getCssVar('--font-family', 'Arial'), size: 14, weight: 'bold' }
                    },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(items) {
                            if (!items || items.length === 0) return '';
                            const idx = items[0].dataIndex;
                            const raw = chartRawPeriods[idx] || chartDataObj.rawPeriods[idx] || chartDataObj.labels[idx] || '';
                            if (currentPeriod === 'month_day') {
                                const date = new Date(DateUtils.periodToTimestamp(raw));
                                const day = date.getUTCDate();
                                const month = DateUtils.monthNamesFull[date.getUTCMonth()];
                                const year = date.getUTCFullYear();
                                return `${day} de ${month} de ${year}`;
                            }
                            if (currentPeriod === 'quarter_week') {
                                return DateUtils.weekOfMonthFromRaw(raw);
                            }
                            if (currentPeriod === 'year_month') {
                                const parts = raw.split('-');
                                const year = parts[0];
                                const month = DateUtils.monthNamesFull[parseInt(parts[1], 10) - 1];
                                return `${month} de ${year}`;
                            }
                            return raw;
                        },
                        label: function(context) {
                            // Exibe o valor completo no tooltip
                            const val = context.parsed.y || 0;
                            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(val);
                        }
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

function computeInitialPeriod() {
    const today = new Date();
    const isLastDayOfMonth = today.getUTCDate() === new Date(today.getUTCFullYear(), today.getUTCMonth() + 1, 0).getUTCDate();

    let start, end;
    if (isLastDayOfMonth) {
        // Primeiro dia do mês atual até hoje
        start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
        end = today;
    } else {
        // Mesmo dia do mês passado até hoje
        const lastMonth = DateUtils.addMonths(today, -1);
        start = new Date(Date.UTC(lastMonth.getUTCFullYear(), lastMonth.getUTCMonth(), today.getUTCDate()));
        end = today;
    }

    return {
        period: 'month_day',
        start_date: DateUtils.formatDateYYYYMMDD(start),
        end_date: DateUtils.formatDateYYYYMMDD(end)
    };
}

// --- Funções de preenchimento de selects ---
function populateYearSelect(yearsBack = 5) {
    const yearSelect = document.getElementById('year-select');
    const currentYear = new Date().getFullYear();
    const startYear = 2023; // Ano inicial fixo

    // Adicionar uma opção padrão vazia
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '—';
    defaultOption.selected = true; // Nenhum ano selecionado por padrão
    yearSelect.appendChild(defaultOption);

    // Preencher os anos a partir de 2023 até o ano atual
    for (let year = currentYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    yearSelect.addEventListener('change', () => {
        const monthSelect = document.getElementById('month-select');
        monthSelect.disabled = !yearSelect.value;
        monthSelect.setAttribute('aria-disabled', !yearSelect.value);
    });
}

function populateMonthSelect() {
    const monthSelect = document.getElementById('month-select');
    const months = DateUtils.monthNamesFull;

    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = String(index + 1).padStart(2, '0'); // Valores no formato "01", "02", etc.
        option.textContent = month.charAt(0).toUpperCase() + month.slice(1); // Capitaliza o nome do mês
        monthSelect.appendChild(option);
    });
}

// --- Funções de inicialização de botões rápidos ---
function setupQuickButtons() {
    document.getElementById('btn-last-month').addEventListener('click', async () => {
        const today = new Date();
        const lastMonth = DateUtils.addMonths(today, -1);
        const start = DateUtils.formatDateYYYYMMDD(lastMonth);
        const end = DateUtils.formatDateYYYYMMDD(today);
        await applyFiltersAndRender({ period: 'month_day', start_date: start, end_date: end });
    });

    document.getElementById('btn-last-quarter').addEventListener('click', async () => {
        const today = new Date();
        const threeMonthsAgo = DateUtils.addMonths(today, -3);
        const start = DateUtils.formatDateYYYYMMDD(threeMonthsAgo);
        const end = DateUtils.formatDateYYYYMMDD(today);
        await applyFiltersAndRender({ period: 'quarter_week', start_date: start, end_date: end });
    });

    document.getElementById('btn-last-year').addEventListener('click', async () => {
        const today = new Date();
        const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        const start = DateUtils.formatDateYYYYMMDD(lastYear);
        const end = DateUtils.formatDateYYYYMMDD(today);
        await applyFiltersAndRender({ period: 'year_month', start_date: start, end_date: end });
    });
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
    populateYearSelect(5);
    populateMonthSelect();
    setupQuickButtons();

    // Aplicar o filtro inicial com base no último mês
    const initialPeriod = computeInitialPeriod();
    await applyFiltersAndRender(initialPeriod);
});
