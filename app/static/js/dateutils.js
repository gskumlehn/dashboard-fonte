(function (global) {
    'use strict';

    const monthNamesShort = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    const monthNamesFull = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

    function formatDateYYYYMMDD(d) {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function addMonths(date, months) {
        const d = new Date(date);
        const day = d.getUTCDate();
        d.setUTCMonth(d.getUTCMonth() + months);
        if (d.getUTCDate() < day) {
            d.setUTCDate(0);
        }
        return d;
    }

    function getISOWeekNumber(d) {
        const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    }

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

    function periodToTimestamp(p) {
        if (!p) return null;
        const isoDate = /^\d{4}-\d{2}-\d{2}$/;
        const yearMonth = /^\d{4}-\d{2}$/;

        if (isoDate.test(p)) {
            const parts = p.split('-').map(x => parseInt(x, 10));
            return Date.UTC(parts[0], parts[1] - 1, parts[2]);
        }
        if (yearMonth.test(p)) {
            const parts = p.split('-').map(x => parseInt(x, 10));
            return Date.UTC(parts[0], parts[1] - 1, 1);
        }

        return null;
    }

    function weekOfMonthFromRaw(raw) {
        if (!raw) return '';
        const m = String(raw).match(/^(\d{4})-(\d{2})-W(\d+)$/);
        if (!m) return raw;
        const year = parseInt(m[1], 10);
        const month = parseInt(m[2], 10);
        const weekOfYear = parseInt(m[3], 10);

        const firstDay = new Date(Date.UTC(year, month - 1, 1));
        const weekFirst = getISOWeekNumber(firstDay);
        let wom = weekOfYear - weekFirst + 1;
        if (wom < 1) wom = 1;

        const mon = monthNamesShort[(month - 1) % 12] || String(month);
        return `${wom}ª/${mon}`;
    }

    function weekOfMonthInfo(raw) {
        if (!raw) return null;
        const m = String(raw).match(/^(\d{4})-(\d{2})-W(\d+)$/);
        if (!m) return null;
        const year = parseInt(m[1], 10);
        const month = parseInt(m[2], 10);
        const weekOfYear = parseInt(m[3], 10);

        const firstDay = new Date(Date.UTC(year, month - 1, 1));
        const weekFirst = getISOWeekNumber(firstDay);
        let wom = weekOfYear - weekFirst + 1;
        if (wom < 1) wom = 1;

        const monthNameShort = monthNamesShort[(month - 1) % 12] || String(month);
        const monthNameFull = monthNamesFull[(month - 1) % 12] || String(month);
        return { wom, month, monthNameShort, monthNameFull, year };
    }

    function formatMonthLabelFromPeriod(periodValue) {
        if (!periodValue) return '';
        let y = '', m = '';
        const dashParts = String(periodValue).split('-');
        if (dashParts.length >= 2) {
            y = dashParts[0];
            m = dashParts[1].padStart(2,'0');
        } else if (/^\d{6}$/.test(periodValue)) {
            y = periodValue.substr(0,4);
            m = periodValue.substr(4,2);
        } else if (/^\d{8}$/.test(periodValue)) {
            y = periodValue.substr(0,4);
            m = periodValue.substr(4,2);
        } else {
            return periodValue;
        }
        const mi = parseInt(m, 10) - 1;
        const yy = y.substr(2,2);
        const mon = monthNamesShort[mi] || m;
        return `${mon}/${yy}`;
    }

    function formatDayLabelFromPeriod(periodValue) {
        if (!periodValue) return '';
        const parts = String(periodValue).split('-');
        if (parts.length >= 3) {
            const dd = parseInt(parts[2], 10);
            return String(dd);
        }
        return periodValue;
    }

    global.DateUtils = {
        formatDateYYYYMMDD,
        addMonths,
        getISOWeekNumber,
        ordinalPortuguese,
        periodToTimestamp,
        weekOfMonthFromRaw,
        weekOfMonthInfo,
        formatMonthLabelFromPeriod,
        formatDayLabelFromPeriod,
        monthNamesShort,
        monthNamesFull
    };
})(window);
