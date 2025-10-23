const itemsPerPage = 10;
let currentPage = 1;
let sortColumn = 'VolumeHistorico';
let sortDirection = 'desc';

function getRiskLabel(risk) {
    const labels = {
        high: 'Alto',
        medium: 'Médio',
        low: 'Baixo'
    };
    return labels[risk] || risk;
}

function sortData(data, column, direction) {
    return [...data].sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];

        if (column === 'ultimaOperacao') {
            valueA = a.ultimaOperacaoDate;
            valueB = b.ultimaOperacaoDate;
        }

        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function paginateData(data, page) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
}

function getTotalPages(data) {
    return Math.ceil(data.length / itemsPerPage);
}

function updateSortIndicators() {
    document.querySelectorAll('th.sortable').forEach(th => {
        th.classList.remove('active', 'asc', 'desc');
        th.querySelector('.sort-indicator').textContent = '';
    });

    const activeHeader = document.querySelector(`th[data-sort="${sortColumn}"]`);
    if (activeHeader) {
        activeHeader.classList.add('active', sortDirection);
        const indicator = activeHeader.querySelector('.sort-indicator');
        indicator.textContent = sortDirection === 'asc' ? '▲' : '▼';
    }
}

function updatePaginationInfo(data) {
    const totalPages = getTotalPages(data);
    const paginationInfo = document.getElementById('pagination-info');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    paginationInfo.textContent = `${currentPage} de ${totalPages}`;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

function populateTable(data) {
    const tbody = document.getElementById('churn-tbody');
    tbody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.cliente}</td>
            <td>${new Date(row.ultima_operacao).toLocaleDateString('pt-BR')}</td>
            <td>${row.dias_inativo}</td>
            <td>R$ ${parseFloat(row.volume_historico).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td><span class="risk-badge risk-${row.risco.toLowerCase()}">${row.risco}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function handleSort(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'desc';
    }
    currentPage = 1;
    fetchChurnData();
}

function setupSortHandlers() {
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            handleSort(column);
        });
    });
}

function setupPaginationHandlers() {
    document.getElementById('prev-btn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchChurnData();
        }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        currentPage++;
        fetchChurnData();
    });
}

function fetchChurnData() {
    const params = new URLSearchParams({
        page: currentPage,
        items_per_page: itemsPerPage,
        sort_column: sortColumn,
        sort_direction: sortDirection
    });

    fetch(`/comercial/churn-analysis/data?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            populateTable(data);
        })
        .catch(error => console.error('Erro ao buscar dados:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    setupSortHandlers();
    setupPaginationHandlers();
    fetchChurnData();
});
