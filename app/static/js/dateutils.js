// Date utility helpers used by dashboard.js

(function (global) {
    const monthNamesShort = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    const monthNamesFull = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

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

    // retorna número de semana ISO para uma Date (1-53) usando UTC para evitar timezone shifts
    function getISOWeekNumber(d) {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    }

    // ordinal em PT-BR
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

    // converte period strings em timestamp UTC aproximado
    function periodToTimestamp(p) {
        if (!p) return null;
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

            const firstDay = new Date(Date.UTC(year, month - 1, 1));
            const weekFirst = getISOWeekNumber(firstDay);
            let wom = weekOfYear - weekFirst + 1;
            if (wom < 1) wom = 1;
            // aproxima dia: 1 + (wom-1)*7
            const approxDay = 1 + (wom - 1) * 7;
            const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
            const day = Math.min(approxDay, lastDay);
            return Date.UTC(year, month - 1, day);
        }

        const parsed = Date.parse(p);
        return isNaN(parsed) ? null : parsed;
    }

    // retorna "w/mm" compact (ex: "1/out") -- agora com sufixo ordinal: "1ª/out"
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

    // retorna objeto com info da semana: { wom: 1, month: 10, monthNameFull: 'outubro' }
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

    // expose (keep existing exports, add new)
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
