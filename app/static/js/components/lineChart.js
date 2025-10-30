(function (global) {
    'use strict';
    /**
     * LineChartComponent genérico (uso com Chart.js)
     *
     * Construtor:
     *   new LineChartComponent(canvasId, config)
     *
     * Config (opções principais):
     *   dataset: {
     *     labelKey: 'period_formatted', // campo utilizado para labels visíveis
     *     rawKey: 'period',             // campo bruto (ex: '2025-10-01' ou '2025-10-W1')
     *     valueKey: 'total_volume'      // campo numérico usado como Y
     *   }
     *   label: 'Volume Total'           // texto do dataset
     *   borderColor, backgroundColor
     *   yFormatter(value) -> string     // formata ticks Y
     *   tooltipFormatter(value) -> string
     *   xLabelFormatter(raw, formatted, periodType) -> string // formata tick X / tooltip title
     *   fillMissingDates: true/false    // se true e period === 'month_day' irá preencher dias sem valor com 0
     *
     * API:
     *   init()           // cria Chart.js no canvas
     *   update(rows, periodType) // atualiza dados; periodType = 'month_day'|'year_month'|...
     *   destroy()
     *
     * Observação: rows é array de objetos vindos do backend. O componente usa dataset.* para mapear campos.
     */

    function LineChartComponent(canvasId, config = {}) {
        this.canvasId = canvasId;
        this.config = Object.assign({
            dataset: { labelKey: 'period_formatted', rawKey: 'period', valueKey: 'value' },
            label: 'Dataset',
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            yFormatter: null,
            tooltipFormatter: null,
            xLabelFormatter: null,
            fillMissingDates: false
        }, config);
        this.chart = null;
        this._lastPeriod = null;
        this._chartRawPeriods = [];
    }

    // Default y tick formatter (fallback)
    LineChartComponent.prototype._defaultYFormatter = function (v) {
        const absVal = Math.abs(Number(v) || 0);
        const MILLION = 1000000;
        const THRESHOLD = 100000;
        if (absVal >= THRESHOLD) {
            const m = v / MILLION;
            const formatted = Number.isInteger(m) ? m.toFixed(0) : m.toFixed(1);
            return `${formatted}M`;
        }
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
    };

    LineChartComponent.prototype._getYFormatter = function () {
        return (typeof this.config.yFormatter === 'function') ? this.config.yFormatter : this._defaultYFormatter;
    };

    LineChartComponent.prototype._getTooltipFormatter = function () {
        return (typeof this.config.tooltipFormatter === 'function')
            ? this.config.tooltipFormatter
            : (v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v));
    };

    LineChartComponent.prototype._getXLabelFormatter = function () {
        return (typeof this.config.xLabelFormatter === 'function')
            ? this.config.xLabelFormatter
            : ((raw, formatted, period) => formatted);
    };

    // Converte rows para estrutura interna ordenada (labels, rawPeriods, values)
    LineChartComponent.prototype._buildChartData = function (rows) {
        const map = this.config.dataset;
        if (!rows || rows.length === 0) return { labels: [], rawPeriods: [], data: [] };

        const items = rows.map(r => {
            const raw = r[map.rawKey];
            const ts = DateUtils.periodToTimestamp(String(raw || ''));
            return { r, ts };
        });

        items.sort((a, b) => {
            if (a.ts === null && b.ts === null) {
                return String(a.r[this.config.dataset.rawKey] || '').localeCompare(String(b.r[this.config.dataset.rawKey] || ''));
            }
            if (a.ts === null) return 1;
            if (b.ts === null) return -1;
            return a.ts - b.ts;
        });

        const sortedRows = items.map(it => it.r);
        return {
            labels: sortedRows.map(r => r[this.config.dataset.labelKey]),
            rawPeriods: sortedRows.map(r => r[this.config.dataset.rawKey]),
            data: sortedRows.map(r => Number(r[this.config.dataset.valueKey]) || 0)
        };
    };

    // Se enabled, preenche todos os dias entre min/max com 0 (apenas para period === 'month_day')
    LineChartComponent.prototype._fillDays = function (chartDataObj) {
        const mapVal = {};
        chartDataObj.rawPeriods.forEach((d, i) => {
            if (d) mapVal[d] = chartDataObj.data[i];
        });

        const timestamps = chartDataObj.rawPeriods
            .map(p => DateUtils.periodToTimestamp(p))
            .filter(ts => ts !== null)
            .sort((a, b) => a - b);

        if (timestamps.length === 0) return { labels: [], values: [], rawPeriods: [] };

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

        return { labels: dayLabels, values, rawPeriods: rawDates };
    };

    // Inicia o Chart.js com opções mínimas; dataset vazio inicialmente
    LineChartComponent.prototype.init = function () {
        const canvas = document.getElementById(this.canvasId);
        if (!canvas) throw new Error(`Canvas ${this.canvasId} not found`);
        const ctx = canvas.getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: this.config.label,
                    data: [],
                    borderColor: this.config.borderColor,
                    backgroundColor: this.config.backgroundColor,
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
                            callback: (value, index) => {
                                // value é label; index é índice
                                return this._getXLabelFormatter()(this._chartRawPeriods && this._chartRawPeriods[index], value, this._lastPeriod);
                            }
                        },
                        grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color') || '#eee' }
                    },
                    y: {
                        min: 0,
                        ticks: {
                            callback: (v) => this._getYFormatter()(v),
                            beginAtZero: true
                        },
                        grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color') || '#eee' }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                if (!items || items.length === 0) return '';
                                const idx = items[0].dataIndex;
                                const raw = this._chartRawPeriods && this._chartRawPeriods[idx];
                                const label = (this.chart && this.chart.data && this.chart.data.labels && this.chart.data.labels[idx]) || '';
                                return this._getXLabelFormatter()(raw, label, this._lastPeriod);
                            },
                            label: (ctx) => this._getTooltipFormatter()(ctx.parsed.y)
                        }
                    }
                }
            }
        });
    };

    // Atualiza o gráfico com rows e o tipo de período (ex: 'month_day')
    LineChartComponent.prototype.update = function (rows, period) {
        if (!this.chart) this.init();
        this._lastPeriod = period || this._lastPeriod;

        const chartDataObj = this._buildChartData(rows);

        let labels = [];
        let values = [];
        let rawPeriods = [];

        if (this._lastPeriod === 'month_day' && this.config.fillMissingDates) {
            const prepared = this._fillDays(chartDataObj);
            labels = prepared.labels;
            values = prepared.values;
            rawPeriods = prepared.rawPeriods;
        } else {
            labels = chartDataObj.labels.slice();
            values = chartDataObj.data.slice();
            rawPeriods = chartDataObj.rawPeriods.slice();
        }

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = values;
        this.chart.data.datasets[0].label = this.config.label || this.chart.data.datasets[0].label;
        this._chartRawPeriods = rawPeriods;
        this.chart.update();

        return { chart: this.chart, labels, values, rawPeriods };
    };

    LineChartComponent.prototype.destroy = function () {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    };

    global.LineChartComponent = LineChartComponent;
})(window);
