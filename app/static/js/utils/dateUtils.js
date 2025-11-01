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
            return `${year}-${month}-${day}`; // Formato correto para inputs de data e backend
        }
        if (formatString === 'dd/MM/yyyy') {
            return `${day}/${month}/${year}`; // Formato alternativo, se necessário
        }
        if (formatString === 'dd/MMM') {
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return `${day}/${months[date.getMonth()]}`; // Formato abreviado com mês em português
        }
        return `${year}-${month}-${day}`; // Padrão de fallback
    },

    // Converte uma string ISO para um objeto Date
    convertISOToDate(isoString) {
        if (!isoString) return null; // Retorna nulo se a string ISO for inválida
        const parts = isoString.split('-').map(Number);
        if (parts.length === 3) {
            return new Date(parts[0], parts[1] - 1, parts[2]); // Ajusta o mês (0-11)
        }
        console.error('Invalid ISO date string:', isoString);
        return null; // Retorna nulo em caso de erro
    },

    // Retorna a abreviação do mês em português
    getPortugueseMonthAbbreviation(date) {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${months[date.getMonth()]}/${date.getFullYear()}`; // Corrigido: fechamento do template string
    },

    // Retorna o ano de uma data
    extractYearFromDate(date) {
        return date.getFullYear();
    }
};

// Disponibilizar como variável global
window.dateUtils = dateUtils;
