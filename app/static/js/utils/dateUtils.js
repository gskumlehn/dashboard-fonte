const dateUtils = {
    // Subtrai meses de uma data
    subtractMonthsFromDate(date, months) {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() - months);
        return newDate;
    },

    // Formata uma data para o formato especificado (yyyy-MM-dd)
    formatDateToPattern(date, formatString) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        if (formatString === 'yyyy-MM-dd') {
            return `${year}-${month}-${day}`;
        }
        return `${day}/${month}/${year}`; // Formato padrão caso necessário
    },

    // Converte uma string ISO para um objeto Date
    convertISOToDate(isoString) {
        const [year, month, day] = isoString.split('-').map(Number);
        return new Date(year, month - 1, day); // Ajusta o mês (0-11)
    },

    // Retorna a abreviação do mês em português
    getPortugueseMonthAbbreviation(date) {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${months[date.getMonth()]}/${date.getFullYear()`;
    },

    // Retorna o ano de uma data
    extractYearFromDate(date) {
        return date.getFullYear();
    }
};

// Disponibilizar como variável global
window.dateUtils = dateUtils;
