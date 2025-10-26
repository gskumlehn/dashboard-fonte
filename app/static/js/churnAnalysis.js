const itemsPerPage = 10;
let currentPage = 1;
let sortColumn = 'DiasInativo';
let sortDirection = 'asc';

function getRiskLabel(risk) {
    const labels = {
        'Cunsumado': 'churned',
        'Alto': 'high',
        'Médio': 'medium',
        'Baixo': 'low'
    };
    return labels[risk] || risk;
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

function updatePaginationInfo(totalPages) {
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
            <td><span class="risk-badge risk-${getRiskLabel(row.risco)}">${row.risco}</span></td>
        `;
        tbody.appendChild(tr);
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
        .then(result => {
            const { data, total_count } = result;
            const totalPages = Math.ceil(total_count / itemsPerPage);
            populateTable(data);
            updatePaginationInfo(totalPages);
            updateSortIndicators();
        })
        .catch(error => console.error('Erro ao buscar dados:', error));
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

document.addEventListener('DOMContentLoaded', () => {
    setupSortHandlers();
    setupPaginationHandlers();
    fetchChurnData();
});
