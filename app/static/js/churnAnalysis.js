document.addEventListener('DOMContentLoaded', () => {
    fetch('/comercial/churn-analysis/data')
        .then(response => response.json())
        .then(data => renderTable(data))
        .catch(error => console.error('Erro ao buscar dados:', error));
});

function renderTable(data) {
    const tableBody = document.querySelector('#churn-table tbody');
    tableBody.innerHTML = ''; // Limpa a tabela antes de renderizar

    data.forEach(row => {
        const tr = document.createElement('tr');

        // Cliente
        const clienteTd = document.createElement('td');
        clienteTd.textContent = row.cliente;
        tr.appendChild(clienteTd);

        // Última Operação
        const ultimaOperacaoTd = document.createElement('td');
        ultimaOperacaoTd.textContent = new Date(row.ultima_operacao).toLocaleDateString('pt-BR');
        tr.appendChild(ultimaOperacaoTd);

        // Dias Inativo
        const diasInativoTd = document.createElement('td');
        diasInativoTd.textContent = row.dias_inativo;
        tr.appendChild(diasInativoTd);

        // Volume Histórico
        const volumeHistoricoTd = document.createElement('td');
        const volumeHistorico = parseFloat(row.volume_historico); // Converte para número
        if (!isNaN(volumeHistorico)) {
            volumeHistoricoTd.textContent = `R$ ${volumeHistorico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        } else {
            volumeHistoricoTd.textContent = 'N/A'; // Valor padrão caso seja inválido
        }
        tr.appendChild(volumeHistoricoTd);

        // Risco de Churn
        const riscoTd = document.createElement('td');
        riscoTd.textContent = row.risco;
        riscoTd.classList.add(getRiskClass(row.risco));
        tr.appendChild(riscoTd);

        tableBody.appendChild(tr);
    });
}

function getRiskClass(riskLevel) {
    switch (riskLevel) {
        case 'Alto Risco': return 'risk-high';
        case 'Médio Risco': return 'risk-medium';
        case 'Baixo Risco': return 'risk-low';
        default: return '';
    }
}
