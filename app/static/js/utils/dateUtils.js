import { format, subMonths, parseISO, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const dateUtils = {
    // Subtrai meses de uma data
    subtractMonthsFromDate(date, months) {
        return subMonths(date, months);
    },

    // Formata uma data para o formato especificado
    formatDateToPattern(date, formatString) {
        return format(date, formatString, { locale: ptBR });
    },

    // Converte uma string ISO para um objeto Date
    convertISOToDate(isoString) {
        return parseISO(isoString);
    },

    // Retorna a abreviação do mês em português
    getPortugueseMonthAbbreviation(date) {
        const monthIndex = getMonth(date); // 0-11
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return months[monthIndex];
    },

    // Retorna o ano de uma data
    extractYearFromDate(date) {
        return getYear(date);
    }
};

export default dateUtils;
