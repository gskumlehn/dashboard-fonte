const itemsPerPage = 10;
let currentPage = 1;
let sortColumn = 'InactiveDays';
let sortDirection = 'asc';
let riskFilter = '';

function getRiskLabel(risk) {
    const labels = {
        'Consumado': 'churned',
        'Alto': 'high',
        'Médio': 'medium',
        'Baixo': 'low'
        '-': 'none'
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
    const tbody = document.getElementById('client-tbody');
    tbody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        const lastOperationDate = dateUtils.convertISOToDate(row.last_operation);

        // Format the volume as 74.398,56
        const formattedVolume = row.historical_volume
            .replace(/\./g, 'X')
            .replace(/,/g, '.')
            .replace(/X/g, ',');

        tr.innerHTML = `
            <td>${row.client}</td>
            <td><a href="mailto:${row.email}">${row.email}</a></td>
            <td>${dateUtils.formatDateToPattern(lastOperationDate, 'dd/MM/yyyy')}</td>
            <td>${row.inactive_days}</td>
            <td>${formattedVolume}</td>
            <td>${row.agent}</td>
            <td><span class="risk-badge risk-${getRiskLabel(row.risk)}">${row.risk}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function fetchChurnData() {
    const params = new URLSearchParams({
        page: currentPage,
        items_per_page: itemsPerPage,
        sort_column: sortColumn,
        sort_direction: sortDirection,
        risk_filter: riskFilter
    });

    // Update the endpoint URL
    fetch(`/comercial/client-data?${params.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados do servidor.');
            }
            return response.json();
        })
        .then(result => {
            const { data, total_count } = result;
            const totalPages = Math.ceil(total_count / itemsPerPage);
            populateTable(data);
            updatePaginationInfo(totalPages);
            updateSortIndicators();
        })
        .catch(error => {
            console.error('Erro ao buscar dados:', error);
            const tbody = document.getElementById('client-tbody');
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--error-text);">
                        Erro ao carregar dados. Tente novamente mais tarde.
                    </td>
                </tr>
            `;
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

function setupRiskFilterHandler() {
    const riskFilterSelect = document.getElementById('risk-filter');
    riskFilterSelect.addEventListener('change', () => {
        riskFilter = riskFilterSelect.value;
        currentPage = 1;
        fetchChurnData();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupSortHandlers();
    setupPaginationHandlers();
    setupRiskFilterHandler();
    fetchChurnData();
});
