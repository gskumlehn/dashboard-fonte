document.addEventListener('DOMContentLoaded', () => {
    fetch('/comercial/churn-analysis/data')
        .then(response => response.json())
        .then(data => {
            const formattedData = data.map(row => ({
                cliente: row.cliente,
                ultima_operacao: new Date(row.ultima_operacao).toLocaleDateString('pt-BR'),
                dias_inativo: row.dias_inativo,
                volume_historico: `R$ ${parseFloat(row.volume_historico).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                risco: row.risco
            }));
            renderTable(formattedData);
        })
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
        ultimaOperacaoTd.textContent = row.ultima_operacao;
        tr.appendChild(ultimaOperacaoTd);

        // Dias Inativo
        const diasInativoTd = document.createElement('td');
        diasInativoTd.textContent = row.dias_inativo;
        tr.appendChild(diasInativoTd);

        // Volume Histórico
        const volumeHistoricoTd = document.createElement('td');
        volumeHistoricoTd.textContent = row.volume_historico;
        tr.appendChild(volumeHistoricoTd);

        // Risco de Churn
        const riscoTd = document.createElement('td');
        riscoTd.textContent = row.risco;
        const riskClass = getRiskClass(row.risco);
        if (riskClass) {
            riscoTd.classList.add(riskClass); // Adiciona a classe apenas se não for vazia
        }
        tr.appendChild(riscoTd);

        tableBody.appendChild(tr);
    });
}

function getRiskClass(riskLevel) {
    switch (riskLevel) {
        case 'Alto': return 'risk-high';
        case 'Médio': return 'risk-medium';
        case 'Baixo': return 'risk-low';
        default: return null; // Retorna null em vez de uma string vazia
    }
}
