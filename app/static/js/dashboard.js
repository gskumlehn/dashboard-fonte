// --- Variáveis globais ---
let volumeChart = null;
let currentPeriod = 'year_month'; // Período atual usado para formatar o eixo X

// --- Adicionar variável para instância do componente de linha ---
let volumeChartComponent = null;

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

/**
 * Formata moeda BRL com opção de remover o símbolo (R$).
 * - value: número
 * - opts.symbol: boolean (true => com "R$", false => sem símbolo)
 * - opts.maximumFractionDigits / opts.minimumFractionDigits opcional
 *
 * Usa formatToParts para remover somente a parte 'currency' quando symbol=false (mantendo separadores corretos).
 */
function formatCurrency(value, opts = {}) {
    const { symbol = true, maximumFractionDigits = 0, minimumFractionDigits = 0 } = opts;
    const num = Number(value) || 0;
    const nf = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits,
        minimumFractionDigits
    });

    if (symbol) {
        return nf.format(num);
    }
    // Remove apenas a parte currency, mantendo espaçamento e separadores
    const parts = nf.formatToParts(num);
    const filtered = parts.filter(p => p.type !== 'currency').map(p => p.value).join('');
    return filtered.trim();
}

// Ajustar tickFormatter para usar formato com função centralizada (mantendo R$ no eixo/tooltip)
function tickFormatter(value) {
    const absVal = Math.abs(Number(value) || 0);
    const MILLION = 1000000;
    const THRESHOLD = 100000;

    if (absVal >= THRESHOLD) {
        const m = value / MILLION;
        const formatted = Number.isInteger(m) ? m.toFixed(0) : m.toFixed(1);
        return `${formatted}M`;
    }

    // Usa formatCurrency com símbolo para ticks
    return formatCurrency(value, { symbol: true, maximumFractionDigits: 0 });
}

// --- Nova função: formata valores na sidebar sem cifrão ---
// Busca elementos com atributo data-no-currency="true" ou com a classe .no-currency
// Preferência de fonte de valor:
// 1) data-value (valor numérico bruto em atributo) 2) textContent (tenta parsear)
// Atualiza textContent com valor formatado sem símbolo.
function formatSidebarValues() {
    const nodes = document.querySelectorAll('[data-no-currency="true"], .no-currency');
    if (!nodes || nodes.length === 0) return;

    nodes.forEach(el => {
        try {
            let raw = null;
            // Usa data-value se presente (mais confiável)
            if (el.dataset && el.dataset.value !== undefined) {
                raw = el.dataset.value;
            } else {
                // Tenta extrair número do textContent (remove R$, pontos, espaços; converte vírgula para ponto)
                const txt = (el.textContent || '').replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
                const m = txt.match(/-?\d+(\.\d+)?/);
                raw = m ? m[0] : null;
            }
            const num = raw !== null ? Number(raw) : NaN;
            if (!isNaN(num)) {
                // Decide decimais: inteiro -> 0, caso contrário 2
                const frac = (num % 1 === 0) ? 0 : 2;
                el.textContent = formatCurrency(num, { symbol: false, maximumFractionDigits: frac, minimumFractionDigits: frac });
            }
        } catch (e) {
            // não quebrar a UI em caso de erro; apenas logar no console dev
            // eslint-disable-next-line no-console
            console.debug('formatSidebarValues error for element', el, e);
        }
    });
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
// Substituir a antiga função renderVolumeChart pelo uso do componente reusável e genérico
function renderVolumeChart(rows) {
    // cria instância do componente se necessário (usa canvas id 'volumeChart')
    if (!volumeChartComponent) {
        volumeChartComponent = new LineChartComponent('volumeChart', {
            dataset: { labelKey: 'period_formatted', rawKey: 'period', valueKey: 'total_volume' },
            label: 'Volume Total',
            borderColor: getCssVar('--chart-color-1', '#3b82f6'),
            backgroundColor: hexToRgba(getCssVar('--chart-color-1', '#3b82f6'), 0.1),
            // usa tickFormatter e formatCurrency definidos neste arquivo
            yFormatter: tickFormatter,
            tooltipFormatter: (v) => formatCurrency(v, { symbol: true, minimumFractionDigits: 2 }),
            // formata o título/label do eixo X dependendo do tipo do período
            xLabelFormatter: (raw, formatted, periodType) => {
                if (!raw && !formatted) return '';
                if (periodType === 'month_day') {
                    const ts = DateUtils.periodToTimestamp(raw || formatted);
                    if (ts === null) return formatted || raw;
                    const date = new Date(ts);
                    const day = date.getUTCDate();
                    const month = DateUtils.monthNamesFull[date.getUTCMonth()];
                    const year = date.getUTCFullYear();
                    return `${day} de ${month} de ${year}`;
                }
                if (periodType === 'quarter_week') {
                    return DateUtils.weekOfMonthFromRaw(raw || formatted);
                }
                if (periodType === 'year_month') {
                    const parts = String(raw || formatted).split('-');
                    if (parts.length >= 2) {
                        const year = parts[0];
                        const month = DateUtils.monthNamesFull[parseInt(parts[1], 10) - 1];
                        return `${month} de ${year}`;
                    }
                }
                return formatted || raw;
            },
            // para gráfico de volume por dias, preencher dias sem movimentação com 0
            fillMissingDates: true
        });
        // inicializa o chart (cria objeto Chart.js)
        try {
            volumeChartComponent.init();
        } catch (e) {
            console.error('Erro ao inicializar LineChartComponent:', e);
            return;
        }
    }

    // atualiza o componente com os dados e período atual
    const result = volumeChartComponent.update(rows, currentPeriod);

    // após renderizar o gráfico, atualiza os valores da sidebar (elementos marcados)
    formatSidebarValues();

    // opcional: retornar resultado para debugging
    return result;
}

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
    // Garantir atualização da sidebar também aqui (caso algo externo mude antes do render)
    formatSidebarValues();
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

    // Também formatar valores da sidebar na inicialização
    formatSidebarValues();
});
