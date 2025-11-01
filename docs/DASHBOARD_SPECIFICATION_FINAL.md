# Dashboard Fonte - Especificação Técnica Completa

**Data**: 1 de novembro de 2025  
**Versão**: 3.0 (Final - Priorizada e Estruturada)  
**Status**: ✅ Pronto para Implementação

---

## 📋 Visão Geral

Este documento especifica o dashboard completo da Fonte Inc com foco em **implementação incremental e priorizada**. Cada tela está organizada em **MVP** (funcionalidades essenciais) e **Evolução** (melhorias incrementais).

**Stack Tecnológico**:
- Backend: Python Flask + SQLAlchemy
- Frontend: Bootstrap 5 + Chart.js
- Database: SQL Server (LiveWork)
- Real-time: WebSocket

**Princípios de Design**:
- Queries com aliases em inglês
- Nomes de tabelas em português (conforme banco)
- Soft delete universal (`IsDeleted = 0`)
- Relacionamentos validados

---

## 🎯 Estrutura de Telas (Priorizada)

### Priorização de Desenvolvimento

| Ordem | Tela | Prioridade | Complexidade | Tempo Estimado |
|-------|------|------------|--------------|----------------|
| 1 | **Visão Executiva** | 🔴 Crítica | Baixa | 2-3 dias |
| 2 | **Análise de Clientes** | 🔴 Crítica | Média | 3-4 dias |
| 3 | **Desempenho de Agentes** | 🟡 Alta | Média | 3-4 dias |
| 4 | **Análise de Risco** | 🟡 Alta | Alta | 4-5 dias |

**Total estimado MVP**: 12-16 dias

---

## 📊 TELA 1: Visão Executiva

**Objetivo**: Dashboard principal com KPIs críticos do negócio em tempo real.

**Público**: Diretoria e gestão executiva.

---

### MVP - Funcionalidades Essenciais

#### KPI 1.1: Volume de Operações

**Descrição**: Volume total de operações fechadas no período.

**Cálculo**:
```
Total Operações = COUNT(Operacao WHERE Status = 1 AND IsDeleted = 0)
Valor Total = SUM(ValorOperacao WHERE Status = 1 AND IsDeleted = 0)
```

**Query SQL**:
```sql
SELECT 
    COUNT(o.Id) as total_operations,
    SUM(o.ValorOperacao) as total_value,
    AVG(o.ValorOperacao) as average_ticket
FROM Operacao o
WHERE o.Status = 1  -- Fechado
  AND o.IsDeleted = 0
  AND o.DataOperacao BETWEEN :start_date AND :end_date;
```

**Tipo de Gráfico**: Card numérico + Line Chart (evolução temporal)

**Chart.js Config**:
```javascript
{
  type: 'line',
  data: {
    labels: ['Jan', 'Fev', 'Mar', ...],
    datasets: [{
      label: 'Volume (R$)',
      data: [valores_mensais],
      borderColor: '#BB5927',  // Fonte Orange
      backgroundColor: 'rgba(187, 89, 39, 0.1)'
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
        }
      }
    }
  }
}
```

---

#### KPI 1.2: Taxa de Inadimplência

**Descrição**: Percentual de documentos vencidos.

**Cálculo**:
```
Taxa = (COUNT(Documentos com Atraso > 0) / COUNT(Total Documentos)) * 100
```

**Query SQL**:
```sql
SELECT 
    COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) as overdue_count,
    COUNT(*) as total_count,
    CAST(COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) AS FLOAT) * 100.0 / 
        NULLIF(COUNT(*), 0) as default_rate
FROM ViewDocumentoAtrasoCalculo v
WHERE v.IsDeleted = 0;
```

**Tipo de Gráfico**: Card com indicador de alerta + Gauge Chart

**Chart.js Config**:
```javascript
{
  type: 'doughnut',
  data: {
    labels: ['Em Dia', 'Vencidos'],
    datasets: [{
      data: [em_dia_percent, vencidos_percent],
      backgroundColor: ['#28a745', '#dc3545']
    }]
  },
  options: {
    circumference: 180,
    rotation: 270,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => context.label + ': ' + context.parsed + '%'
        }
      }
    }
  }
}
```

---

#### KPI 1.3: ROI (Return on Investment)

**Descrição**: Retorno sobre investimento das operações.

**Cálculo**:
```
ROI = ((Valor Recebido - Valor Investido) / Valor Investido) * 100
```

**Query SQL**:
```sql
SELECT 
    SUM(o.ValorOperacao) as invested_value,
    SUM(o.ValorRecebido) as received_value,
    (SUM(o.ValorRecebido) - SUM(o.ValorOperacao)) as profit,
    CAST((SUM(o.ValorRecebido) - SUM(o.ValorOperacao)) AS FLOAT) * 100.0 / 
        NULLIF(SUM(o.ValorOperacao), 0) as roi_percent
FROM Operacao o
WHERE o.Status = 1  -- Fechado
  AND o.IsDeleted = 0
  AND o.DataOperacao BETWEEN :start_date AND :end_date;
```

**Tipo de Gráfico**: Card numérico + Bar Chart (comparativo mensal)

**Chart.js Config**:
```javascript
{
  type: 'bar',
  data: {
    labels: ['Jan', 'Fev', 'Mar', ...],
    datasets: [{
      label: 'ROI (%)',
      data: [roi_mensal],
      backgroundColor: '#BB5927'
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => value + '%'
        }
      }
    }
  }
}
```

---

#### KPI 1.4: Ticket Médio

**Descrição**: Valor médio das operações.

**Cálculo**:
```
Ticket Médio = SUM(ValorOperacao) / COUNT(Operacoes)
```

**Query SQL**:
```sql
SELECT 
    AVG(o.ValorOperacao) as average_ticket,
    MIN(o.ValorOperacao) as min_ticket,
    MAX(o.ValorOperacao) as max_ticket,
    STDEV(o.ValorOperacao) as std_deviation
FROM Operacao o
WHERE o.Status = 1  -- Fechado
  AND o.IsDeleted = 0
  AND o.DataOperacao BETWEEN :start_date AND :end_date;
```

**Tipo de Gráfico**: Card numérico + Line Chart (tendência)

---

### Evolução - Funcionalidades Incrementais

#### KPI 1.5: Taxa de Recompra

**Query SQL**:
```sql
SELECT 
    COUNT(CASE WHEN d.Tipo = 1 THEN 1 END) as repurchased_count,
    COUNT(*) as total_count,
    CAST(COUNT(CASE WHEN d.Tipo = 1 THEN 1 END) AS FLOAT) * 100.0 / 
        NULLIF(COUNT(*), 0) as repurchase_rate
FROM Documento d
WHERE d.IsDeleted = 0
  AND d.DataEmissao BETWEEN :start_date AND :end_date;
```

**Tipo de Gráfico**: Card + Pie Chart

---

#### KPI 1.6: Taxa de Aprovação de Crédito

**Query SQL**:
```sql
SELECT 
    COUNT(CASE WHEN d.StatusLiberacao = 1 THEN 1 END) as approved_count,
    COUNT(CASE WHEN d.StatusLiberacao = 2 THEN 1 END) as rejected_count,
    COUNT(CASE WHEN d.StatusLiberacao = 0 THEN 1 END) as pending_count,
    CAST(COUNT(CASE WHEN d.StatusLiberacao = 1 THEN 1 END) AS FLOAT) * 100.0 / 
        NULLIF(COUNT(CASE WHEN d.StatusLiberacao IN (1, 2) THEN 1 END), 0) as approval_rate
FROM Documento d
WHERE d.IsDeleted = 0
  AND d.DataEmissao BETWEEN :start_date AND :end_date;
```

**Tipo de Gráfico**: Card + Stacked Bar Chart

---

## 📊 TELA 2: Análise de Clientes

**Objetivo**: Análise detalhada de clientes, risco, score e churn.

**Público**: Gestão comercial e análise de crédito.

---

### MVP - Funcionalidades Essenciais

#### KPI 2.1: Ranking de Clientes por Volume

**Descrição**: Top clientes por volume de operações.

**Query SQL**:
```sql
SELECT 
    cb.Id as client_id,
    cb.Razao as client_name,
    cb.Email as client_email,
    COUNT(DISTINCT o.Id) as operation_count,
    SUM(o.ValorOperacao) as total_volume,
    AVG(o.ValorOperacao) as average_ticket,
    MAX(o.DataOperacao) as last_operation_date
FROM CadastroBase cb
INNER JOIN Operacao o ON cb.Id = o.ClienteId
WHERE o.Status = 1  -- Fechado
  AND o.IsDeleted = 0
  AND cb.IsDeleted = 0
  AND o.DataOperacao BETWEEN :start_date AND :end_date
GROUP BY cb.Id, cb.Razao, cb.Email
ORDER BY total_volume DESC
LIMIT 20;
```

**Tipo de Gráfico**: Tabela paginada + Horizontal Bar Chart (Top 10)

**Chart.js Config**:
```javascript
{
  type: 'bar',
  data: {
    labels: [nomes_clientes],
    datasets: [{
      label: 'Volume (R$)',
      data: [volumes],
      backgroundColor: '#BB5927',
      borderColor: '#363432',
      borderWidth: 1
    }]
  },
  options: {
    indexAxis: 'y',  // Horizontal
    responsive: true,
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
        }
      }
    }
  }
}
```

---

#### KPI 2.2: Taxa de Inadimplência por Cliente

**Descrição**: Clientes com maior taxa de inadimplência.

**Query SQL**:
```sql
SELECT 
    cb.Id as client_id,
    cb.Razao as client_name,
    COUNT(d.Id) as total_documents,
    COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) as overdue_documents,
    CAST(COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) AS FLOAT) * 100.0 / 
        NULLIF(COUNT(d.Id), 0) as default_rate,
    SUM(CASE WHEN v.Atraso > 0 THEN d.ValorDocumento ELSE 0 END) as overdue_value
FROM CadastroBase cb
INNER JOIN Operacao o ON cb.Id = o.ClienteId
INNER JOIN Documento d ON o.Id = d.OperacaoId
LEFT JOIN ViewDocumentoAtrasoCalculo v ON d.Id = v.DocumentoId
WHERE d.IsDeleted = 0
  AND o.IsDeleted = 0
  AND cb.IsDeleted = 0
GROUP BY cb.Id, cb.Razao
HAVING COUNT(d.Id) >= 5  -- Mínimo 5 documentos para análise
ORDER BY default_rate DESC
LIMIT 20;
```

**Tipo de Gráfico**: Tabela com indicadores de risco + Scatter Plot

---

#### KPI 2.3: Distribuição de Clientes por Faixa de Volume

**Descrição**: Segmentação de clientes por volume operado.

**Query SQL**:
```sql
WITH ClienteVolume AS (
    SELECT 
        cb.Id as client_id,
        cb.Razao as client_name,
        SUM(o.ValorOperacao) as total_volume
    FROM CadastroBase cb
    INNER JOIN Operacao o ON cb.Id = o.ClienteId
    WHERE o.Status = 1  -- Fechado
      AND o.IsDeleted = 0
      AND cb.IsDeleted = 0
      AND o.DataOperacao BETWEEN :start_date AND :end_date
    GROUP BY cb.Id, cb.Razao
)
SELECT 
    CASE 
        WHEN total_volume < 10000 THEN '< R$ 10k'
        WHEN total_volume < 50000 THEN 'R$ 10k - 50k'
        WHEN total_volume < 100000 THEN 'R$ 50k - 100k'
        WHEN total_volume < 500000 THEN 'R$ 100k - 500k'
        ELSE '> R$ 500k'
    END as volume_range,
    COUNT(*) as client_count,
    SUM(total_volume) as range_total_volume
FROM ClienteVolume
GROUP BY 
    CASE 
        WHEN total_volume < 10000 THEN '< R$ 10k'
        WHEN total_volume < 50000 THEN 'R$ 10k - 50k'
        WHEN total_volume < 100000 THEN 'R$ 50k - 100k'
        WHEN total_volume < 500000 THEN 'R$ 100k - 500k'
        ELSE '> R$ 500k'
    END
ORDER BY range_total_volume DESC;
```

**Tipo de Gráfico**: Pie Chart + Tabela

**Chart.js Config**:
```javascript
{
  type: 'pie',
  data: {
    labels: ['< R$ 10k', 'R$ 10k-50k', 'R$ 50k-100k', 'R$ 100k-500k', '> R$ 500k'],
    datasets: [{
      data: [contagens],
      backgroundColor: [
        '#dc3545',  // Vermelho
        '#ffc107',  // Amarelo
        '#28a745',  // Verde
        '#17a2b8',  // Azul
        '#BB5927'   // Laranja Fonte
      ]
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (context) => {
            return context.label + ': ' + context.parsed + ' clientes';
          }
        }
      }
    }
  }
}
```

---

### Evolução - Funcionalidades Incrementais

#### KPI 2.4: Score de Risco por Cliente

**Descrição**: Cálculo de score de risco baseado em múltiplos fatores.

**Query SQL**:
```sql
WITH ClienteMetrics AS (
    SELECT 
        cb.Id as client_id,
        cb.Razao as client_name,
        COUNT(DISTINCT o.Id) as operation_count,
        SUM(o.ValorOperacao) as total_volume,
        COUNT(d.Id) as total_documents,
        COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) as overdue_documents,
        AVG(CASE WHEN v.Atraso > 0 THEN v.Atraso ELSE 0 END) as avg_delay_days,
        COUNT(CASE WHEN d.TipoBaixa = 4 THEN 1 END) as loss_count,
        DATEDIFF(day, MAX(o.DataOperacao), GETDATE()) as days_since_last_operation
    FROM CadastroBase cb
    INNER JOIN Operacao o ON cb.Id = o.ClienteId
    INNER JOIN Documento d ON o.Id = d.OperacaoId
    LEFT JOIN ViewDocumentoAtrasoCalculo v ON d.Id = v.DocumentoId
    WHERE d.IsDeleted = 0
      AND o.IsDeleted = 0
      AND cb.IsDeleted = 0
    GROUP BY cb.Id, cb.Razao
)
SELECT 
    client_id,
    client_name,
    operation_count,
    total_volume,
    overdue_documents,
    -- Score de Risco (0-100, quanto maior, pior)
    (
        (CAST(overdue_documents AS FLOAT) / NULLIF(total_documents, 0) * 40) +  -- 40% peso inadimplência
        (CASE WHEN avg_delay_days > 90 THEN 30 
              WHEN avg_delay_days > 60 THEN 20 
              WHEN avg_delay_days > 30 THEN 10 
              ELSE 0 END) +  -- 30% peso tempo de atraso
        (CAST(loss_count AS FLOAT) / NULLIF(total_documents, 0) * 20) +  -- 20% peso perdas
        (CASE WHEN days_since_last_operation > 180 THEN 10 
              WHEN days_since_last_operation > 90 THEN 5 
              ELSE 0 END)  -- 10% peso inatividade
    ) as risk_score,
    CASE 
        WHEN (
            (CAST(overdue_documents AS FLOAT) / NULLIF(total_documents, 0) * 40) +
            (CASE WHEN avg_delay_days > 90 THEN 30 WHEN avg_delay_days > 60 THEN 20 WHEN avg_delay_days > 30 THEN 10 ELSE 0 END) +
            (CAST(loss_count AS FLOAT) / NULLIF(total_documents, 0) * 20) +
            (CASE WHEN days_since_last_operation > 180 THEN 10 WHEN days_since_last_operation > 90 THEN 5 ELSE 0 END)
        ) >= 70 THEN 'Alto Risco'
        WHEN (
            (CAST(overdue_documents AS FLOAT) / NULLIF(total_documents, 0) * 40) +
            (CASE WHEN avg_delay_days > 90 THEN 30 WHEN avg_delay_days > 60 THEN 20 WHEN avg_delay_days > 30 THEN 10 ELSE 0 END) +
            (CAST(loss_count AS FLOAT) / NULLIF(total_documents, 0) * 20) +
            (CASE WHEN days_since_last_operation > 180 THEN 10 WHEN days_since_last_operation > 90 THEN 5 ELSE 0 END)
        ) >= 40 THEN 'Médio Risco'
        ELSE 'Baixo Risco'
    END as risk_category
FROM ClienteMetrics
WHERE operation_count >= 3  -- Mínimo 3 operações para análise
ORDER BY risk_score DESC;
```

**Tipo de Gráfico**: Tabela com heat map + Scatter Plot (Volume vs Risk Score)

---

#### KPI 2.5: Análise de Churn

**Descrição**: Identificação de clientes inativos e em risco de churn.

**Query SQL**:
```sql
WITH ClienteUltimaOperacao AS (
    SELECT 
        cb.Id as client_id,
        cb.Razao as client_name,
        cb.Email as client_email,
        MAX(o.DataOperacao) as last_operation_date,
        DATEDIFF(day, MAX(o.DataOperacao), GETDATE()) as days_inactive,
        COUNT(DISTINCT o.Id) as total_operations,
        SUM(o.ValorOperacao) as lifetime_value
    FROM CadastroBase cb
    INNER JOIN Operacao o ON cb.Id = o.ClienteId
    WHERE o.IsDeleted = 0
      AND cb.IsDeleted = 0
    GROUP BY cb.Id, cb.Razao, cb.Email
)
SELECT 
    client_id,
    client_name,
    client_email,
    last_operation_date,
    days_inactive,
    total_operations,
    lifetime_value,
    CASE 
        WHEN days_inactive > 180 THEN 'Churn Confirmado'
        WHEN days_inactive > 90 THEN 'Alto Risco de Churn'
        WHEN days_inactive > 60 THEN 'Médio Risco de Churn'
        ELSE 'Ativo'
    END as churn_status,
    CASE 
        WHEN days_inactive > 180 THEN 4
        WHEN days_inactive > 90 THEN 3
        WHEN days_inactive > 60 THEN 2
        ELSE 1
    END as churn_priority
FROM ClienteUltimaOperacao
WHERE days_inactive > 60  -- Apenas clientes em risco
ORDER BY lifetime_value DESC, days_inactive DESC;
```

**Tipo de Gráfico**: Tabela com alertas + Funnel Chart (status de churn)

**Ação**: Gerar lista de e-mails para campanha de reativação

---

## 📊 TELA 3: Desempenho de Agentes

**Objetivo**: Análise de performance dos agentes comerciais.

**Público**: Gestão comercial e gerentes de vendas.

---

### MVP - Funcionalidades Essenciais

#### KPI 3.1: Ranking de Agentes por Volume

**Descrição**: Performance de cada agente comercial.

**Query SQL**:
```sql
SELECT 
    a.Id as agent_id,
    SUBSTRING(cb.Razao, 1, CHARINDEX(' ', cb.Razao + ' ') - 1) as agent_first_name,
    cb.Razao as agent_full_name,
    cb.Email as agent_email,
    COUNT(DISTINCT o.Id) as operation_count,
    SUM(o.ValorOperacao) as total_volume,
    AVG(o.ValorOperacao) as average_ticket,
    COUNT(DISTINCT o.ClienteId) as unique_clients,
    MAX(o.DataOperacao) as last_operation_date
FROM Agente a
INNER JOIN CadastroBase cb ON a.CadastroBaseId = cb.Id
INNER JOIN Operacao o ON a.Id = o.AgenteId
WHERE o.Status = 1  -- Fechado
  AND o.IsDeleted = 0
  AND a.IsDeleted = 0
  AND cb.IsDeleted = 0
  AND o.DataOperacao BETWEEN :start_date AND :end_date
GROUP BY a.Id, cb.Razao, cb.Email
ORDER BY total_volume DESC;
```

**Tipo de Gráfico**: Tabela + Horizontal Bar Chart (Top 10)

---

#### KPI 3.2: Carteira de Clientes por Agente

**Descrição**: Análise da carteira de cada agente.

**Query SQL**:
```sql
WITH AgenteCarteira AS (
    SELECT 
        a.Id as agent_id,
        SUBSTRING(cb_agent.Razao, 1, CHARINDEX(' ', cb_agent.Razao + ' ') - 1) as agent_name,
        o.ClienteId as client_id,
        cb_client.Razao as client_name,
        COUNT(DISTINCT o.Id) as operation_count,
        SUM(o.ValorOperacao) as total_volume,
        MAX(o.DataOperacao) as last_operation_date
    FROM Agente a
    INNER JOIN CadastroBase cb_agent ON a.CadastroBaseId = cb_agent.Id
    INNER JOIN Operacao o ON a.Id = o.AgenteId
    INNER JOIN CadastroBase cb_client ON o.ClienteId = cb_client.Id
    WHERE o.IsDeleted = 0
      AND a.IsDeleted = 0
      AND cb_agent.IsDeleted = 0
      AND cb_client.IsDeleted = 0
    GROUP BY a.Id, cb_agent.Razao, o.ClienteId, cb_client.Razao
)
SELECT 
    agent_id,
    agent_name,
    COUNT(DISTINCT client_id) as total_clients,
    SUM(operation_count) as total_operations,
    SUM(total_volume) as portfolio_value,
    AVG(total_volume) as avg_client_value,
    COUNT(CASE WHEN DATEDIFF(day, last_operation_date, GETDATE()) > 90 THEN 1 END) as inactive_clients
FROM AgenteCarteira
GROUP BY agent_id, agent_name
ORDER BY portfolio_value DESC;
```

**Tipo de Gráfico**: Tabela + Bubble Chart (Clientes vs Volume vs Ticket Médio)

---

#### KPI 3.3: Operações Abertas por Agente

**Descrição**: Percentual de operações em aberto na carteira.

**Query SQL**:
```sql
WITH AgenteOperacoes AS (
    SELECT 
        a.Id as agent_id,
        SUBSTRING(cb.Razao, 1, CHARINDEX(' ', cb.Razao + ' ') - 1) as agent_name,
        COUNT(CASE WHEN o.Status = 0 THEN 1 END) as open_operations,
        COUNT(CASE WHEN o.Status = 1 THEN 1 END) as closed_operations,
        COUNT(*) as total_operations,
        SUM(CASE WHEN o.Status = 0 THEN o.ValorOperacao ELSE 0 END) as open_value,
        SUM(CASE WHEN o.Status = 1 THEN o.ValorOperacao ELSE 0 END) as closed_value
    FROM Agente a
    INNER JOIN CadastroBase cb ON a.CadastroBaseId = cb.Id
    INNER JOIN Operacao o ON a.Id = o.AgenteId
    WHERE o.IsDeleted = 0
      AND a.IsDeleted = 0
      AND cb.IsDeleted = 0
      AND o.DataOperacao BETWEEN :start_date AND :end_date
    GROUP BY a.Id, cb.Razao
)
SELECT 
    agent_id,
    agent_name,
    open_operations,
    closed_operations,
    total_operations,
    open_value,
    closed_value,
    CAST(open_operations AS FLOAT) * 100.0 / NULLIF(total_operations, 0) as open_rate_percent,
    CAST(open_value AS FLOAT) * 100.0 / NULLIF((open_value + closed_value), 0) as open_value_percent
FROM AgenteOperacoes
ORDER BY open_value DESC;
```

**Tipo de Gráfico**: Tabela + Stacked Bar Chart (Abertas vs Fechadas)

**Chart.js Config**:
```javascript
{
  type: 'bar',
  data: {
    labels: [nomes_agentes],
    datasets: [
      {
        label: 'Abertas',
        data: [operacoes_abertas],
        backgroundColor: '#ffc107'
      },
      {
        label: 'Fechadas',
        data: [operacoes_fechadas],
        backgroundColor: '#28a745'
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true }
    }
  }
}
```

---

### Evolução - Funcionalidades Incrementais

#### KPI 3.4: Taxa de Conversão por Agente

**Query SQL**:
```sql
SELECT 
    a.Id as agent_id,
    SUBSTRING(cb.Razao, 1, CHARINDEX(' ', cb.Razao + ' ') - 1) as agent_name,
    COUNT(DISTINCT o.Id) as total_operations,
    COUNT(DISTINCT CASE WHEN o.Status = 1 THEN o.Id END) as closed_operations,
    CAST(COUNT(DISTINCT CASE WHEN o.Status = 1 THEN o.Id END) AS FLOAT) * 100.0 / 
        NULLIF(COUNT(DISTINCT o.Id), 0) as conversion_rate
FROM Agente a
INNER JOIN CadastroBase cb ON a.CadastroBaseId = cb.Id
INNER JOIN Operacao o ON a.Id = o.AgenteId
WHERE o.IsDeleted = 0
  AND a.IsDeleted = 0
  AND cb.IsDeleted = 0
  AND o.DataOperacao BETWEEN :start_date AND :end_date
GROUP BY a.Id, cb.Razao
ORDER BY conversion_rate DESC;
```

**Tipo de Gráfico**: Bar Chart

---

#### KPI 3.5: Evolução Temporal por Agente

**Query SQL**:
```sql
SELECT 
    a.Id as agent_id,
    SUBSTRING(cb.Razao, 1, CHARINDEX(' ', cb.Razao + ' ') - 1) as agent_name,
    YEAR(o.DataOperacao) as operation_year,
    MONTH(o.DataOperacao) as operation_month,
    COUNT(DISTINCT o.Id) as operation_count,
    SUM(o.ValorOperacao) as monthly_volume
FROM Agente a
INNER JOIN CadastroBase cb ON a.CadastroBaseId = cb.Id
INNER JOIN Operacao o ON a.Id = o.AgenteId
WHERE o.Status = 1  -- Fechado
  AND o.IsDeleted = 0
  AND a.IsDeleted = 0
  AND cb.IsDeleted = 0
  AND o.DataOperacao BETWEEN :start_date AND :end_date
GROUP BY a.Id, cb.Razao, YEAR(o.DataOperacao), MONTH(o.DataOperacao)
ORDER BY agent_id, operation_year, operation_month;
```

**Tipo de Gráfico**: Multi-line Chart (comparativo entre agentes)

---

## 📊 TELA 4: Análise de Risco

**Objetivo**: Monitoramento de risco da carteira e documentos.

**Público**: Gestão de risco e controladoria.

---

### MVP - Funcionalidades Essenciais

#### KPI 4.1: Documentos Vencidos por Faixa de Atraso

**Descrição**: Aging de documentos vencidos.

**Query SQL**:
```sql
SELECT 
    CASE 
        WHEN v.Atraso <= 30 THEN '0-30 dias'
        WHEN v.Atraso <= 60 THEN '31-60 dias'
        WHEN v.Atraso <= 90 THEN '61-90 dias'
        WHEN v.Atraso <= 180 THEN '91-180 dias'
        ELSE '> 180 dias'
    END as aging_range,
    COUNT(d.Id) as document_count,
    SUM(d.ValorDocumento) as total_value,
    AVG(v.Atraso) as avg_delay_days
FROM Documento d
INNER JOIN ViewDocumentoAtrasoCalculo v ON d.Id = v.DocumentoId
WHERE v.Atraso > 0
  AND d.IsDeleted = 0
GROUP BY 
    CASE 
        WHEN v.Atraso <= 30 THEN '0-30 dias'
        WHEN v.Atraso <= 60 THEN '31-60 dias'
        WHEN v.Atraso <= 90 THEN '61-90 dias'
        WHEN v.Atraso <= 180 THEN '91-180 dias'
        ELSE '> 180 dias'
    END
ORDER BY 
    CASE 
        WHEN aging_range = '0-30 dias' THEN 1
        WHEN aging_range = '31-60 dias' THEN 2
        WHEN aging_range = '61-90 dias' THEN 3
        WHEN aging_range = '91-180 dias' THEN 4
        ELSE 5
    END;
```

**Tipo de Gráfico**: Stacked Bar Chart + Tabela

**Chart.js Config**:
```javascript
{
  type: 'bar',
  data: {
    labels: ['0-30 dias', '31-60 dias', '61-90 dias', '91-180 dias', '> 180 dias'],
    datasets: [{
      label: 'Valor (R$)',
      data: [valores_por_faixa],
      backgroundColor: [
        '#ffc107',  // Amarelo
        '#fd7e14',  // Laranja
        '#dc3545',  // Vermelho
        '#6c757d',  // Cinza
        '#343a40'   // Preto
      ]
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
        }
      }
    }
  }
}
```

---

#### KPI 4.2: Taxa de Perda

**Descrição**: Documentos com perda confirmada.

**Query SQL**:
```sql
SELECT 
    COUNT(CASE WHEN d.TipoBaixa = 4 THEN 1 END) as loss_count,
    COUNT(CASE WHEN d.Status = 1 THEN 1 END) as closed_count,
    SUM(CASE WHEN d.TipoBaixa = 4 THEN d.ValorDocumento ELSE 0 END) as loss_value,
    CAST(COUNT(CASE WHEN d.TipoBaixa = 4 THEN 1 END) AS FLOAT) * 100.0 / 
        NULLIF(COUNT(CASE WHEN d.Status = 1 THEN 1 END), 0) as loss_rate
FROM Documento d
WHERE d.IsDeleted = 0
  AND d.DataEmissao BETWEEN :start_date AND :end_date;
```

**Tipo de Gráfico**: Card com alerta + Line Chart (evolução temporal)

---

#### KPI 4.3: Distribuição de Tipos de Baixa

**Descrição**: Análise de como os documentos são baixados.

**Query SQL**:
```sql
SELECT 
    d.TipoBaixa,
    CASE d.TipoBaixa
        WHEN 0 THEN 'Baixa'
        WHEN 1 THEN 'Liquidação'
        WHEN 2 THEN 'Devolução'
        WHEN 3 THEN 'Transferência'
        WHEN 4 THEN 'Perda'
        WHEN 5 THEN 'Confissão de Dívida'
        WHEN 6 THEN 'Baixa por Depósito'
        WHEN 7 THEN 'Baixado Protestado'
        ELSE 'Desconhecido'
    END as tipo_baixa_desc,
    COUNT(*) as document_count,
    SUM(d.ValorDocumento) as total_value,
    CAST(COUNT(*) AS FLOAT) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM Documento d
WHERE d.Status = 1  -- Baixado
  AND d.IsDeleted = 0
  AND d.DataBaixa BETWEEN :start_date AND :end_date
GROUP BY d.TipoBaixa
ORDER BY document_count DESC;
```

**Tipo de Gráfico**: Pie Chart + Tabela

---

### Evolução - Funcionalidades Incrementais

#### KPI 4.4: Concentração de Risco por Sacado

**Query SQL**:
```sql
SELECT 
    s.Id as debtor_id,
    s.Razao as debtor_name,
    COUNT(d.Id) as document_count,
    SUM(d.ValorDocumento) as total_exposure,
    COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) as overdue_count,
    SUM(CASE WHEN v.Atraso > 0 THEN d.ValorDocumento ELSE 0 END) as overdue_value,
    CAST(COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) AS FLOAT) * 100.0 / 
        NULLIF(COUNT(d.Id), 0) as default_rate
FROM Documento d
INNER JOIN CadastroBase s ON d.SacadoId = s.Id
LEFT JOIN ViewDocumentoAtrasoCalculo v ON d.Id = v.DocumentoId
WHERE d.Status = 0  -- Aberto
  AND d.IsDeleted = 0
  AND s.IsDeleted = 0
GROUP BY s.Id, s.Razao
HAVING SUM(d.ValorDocumento) > 10000  -- Exposição mínima
ORDER BY total_exposure DESC
LIMIT 20;
```

**Tipo de Gráfico**: Tabela + Treemap (visualização de concentração)

---

#### KPI 4.5: Provisão para Perdas

**Query SQL**:
```sql
WITH DocumentosRisco AS (
    SELECT 
        d.Id,
        d.ValorDocumento,
        v.Atraso,
        CASE 
            WHEN v.Atraso > 180 THEN 1.0  -- 100% provisão
            WHEN v.Atraso > 90 THEN 0.75  -- 75% provisão
            WHEN v.Atraso > 60 THEN 0.50  -- 50% provisão
            WHEN v.Atraso > 30 THEN 0.25  -- 25% provisão
            ELSE 0.0
        END as provision_rate
    FROM Documento d
    INNER JOIN ViewDocumentoAtrasoCalculo v ON d.Id = v.DocumentoId
    WHERE d.Status = 0  -- Aberto
      AND v.Atraso > 0
      AND d.IsDeleted = 0
)
SELECT 
    COUNT(*) as at_risk_documents,
    SUM(ValorDocumento) as total_at_risk,
    SUM(ValorDocumento * provision_rate) as total_provision,
    AVG(Atraso) as avg_delay_days
FROM DocumentosRisco;
```

**Tipo de Gráfico**: Card + Stacked Area Chart (evolução da provisão)

---

## 🔧 Implementação Técnica

### Estrutura de Backend (Flask + SQLAlchemy)

```python
# app/services/kpi_service.py
from sqlalchemy import text
from app.infra.db_connection import Database
from app.constants.enums import OperacaoStatus, DocumentoStatus, IsDeleted

class KPIService:
    def __init__(self):
        self.db = Database()
    
    def get_volume_operacoes(self, start_date, end_date):
        """KPI 1.1: Volume de Operações"""
        query = text("""
            SELECT 
                COUNT(o.Id) as total_operations,
                SUM(o.ValorOperacao) as total_value,
                AVG(o.ValorOperacao) as average_ticket
            FROM Operacao o
            WHERE o.Status = :status
              AND o.IsDeleted = :is_deleted
              AND o.DataOperacao BETWEEN :start_date AND :end_date
        """)
        
        params = {
            'status': OperacaoStatus.FECHADO,
            'is_deleted': IsDeleted.ATIVO,
            'start_date': start_date,
            'end_date': end_date
        }
        
        result = self.db.execute_query(query, params)
        return result[0] if result else None
    
    def get_taxa_inadimplencia(self):
        """KPI 1.2: Taxa de Inadimplência"""
        query = text("""
            SELECT 
                COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) as overdue_count,
                COUNT(*) as total_count,
                CAST(COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) AS FLOAT) * 100.0 / 
                    NULLIF(COUNT(*), 0) as default_rate
            FROM ViewDocumentoAtrasoCalculo v
            WHERE v.IsDeleted = :is_deleted
        """)
        
        params = {'is_deleted': IsDeleted.ATIVO}
        
        result = self.db.execute_query(query, params)
        return result[0] if result else None
```

### Estrutura de Rotas (Flask)

```python
# app/routes/kpi_routes.py
from flask import Blueprint, request, jsonify
from app.services.kpi_service import KPIService

kpi_bp = Blueprint('kpi', __name__, url_prefix='/api/kpi')
kpi_service = KPIService()

@kpi_bp.route('/volume-operacoes', methods=['GET'])
def get_volume_operacoes():
    """Endpoint: Volume de Operações"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not start_date or not end_date:
        return jsonify({'error': 'start_date e end_date são obrigatórios'}), 400
    
    result = kpi_service.get_volume_operacoes(start_date, end_date)
    
    return jsonify({
        'success': True,
        'data': {
            'total_operations': result['total_operations'],
            'total_value': float(result['total_value']) if result['total_value'] else 0,
            'average_ticket': float(result['average_ticket']) if result['average_ticket'] else 0
        }
    })

@kpi_bp.route('/taxa-inadimplencia', methods=['GET'])
def get_taxa_inadimplencia():
    """Endpoint: Taxa de Inadimplência"""
    result = kpi_service.get_taxa_inadimplencia()
    
    return jsonify({
        'success': True,
        'data': {
            'overdue_count': result['overdue_count'],
            'total_count': result['total_count'],
            'default_rate': float(result['default_rate']) if result['default_rate'] else 0
        }
    })
```

### Estrutura de Frontend (JavaScript + Chart.js)

```javascript
// static/js/dashboard.js

class DashboardController {
    constructor() {
        this.charts = {};
        this.init();
    }
    
    async init() {
        await this.loadVolumeOperacoes();
        await this.loadTaxaInadimplencia();
        this.setupRealTimeUpdates();
    }
    
    async loadVolumeOperacoes() {
        const startDate = document.getElementById('start_date').value;
        const endDate = document.getElementById('end_date').value;
        
        const response = await fetch(
            `/api/kpi/volume-operacoes?start_date=${startDate}&end_date=${endDate}`
        );
        const data = await response.json();
        
        if (data.success) {
            this.updateVolumeCard(data.data);
            this.updateVolumeChart(data.data);
        }
    }
    
    updateVolumeCard(data) {
        document.getElementById('total_operations').textContent = 
            data.total_operations.toLocaleString('pt-BR');
        document.getElementById('total_value').textContent = 
            'R$ ' + data.total_value.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        document.getElementById('average_ticket').textContent = 
            'R$ ' + data.average_ticket.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    }
    
    updateVolumeChart(data) {
        const ctx = document.getElementById('volumeChart').getContext('2d');
        
        if (this.charts.volume) {
            this.charts.volume.destroy();
        }
        
        this.charts.volume = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Volume (R$)',
                    data: data.values,
                    borderColor: '#BB5927',
                    backgroundColor: 'rgba(187, 89, 39, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
                        }
                    }
                }
            }
        });
    }
    
    setupRealTimeUpdates() {
        // WebSocket para atualizações em tempo real
        const ws = new WebSocket('ws://localhost:5000/ws/dashboard');
        
        ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            this.handleRealTimeUpdate(update);
        };
    }
    
    handleRealTimeUpdate(update) {
        if (update.type === 'volume_operacoes') {
            this.updateVolumeCard(update.data);
        } else if (update.type === 'taxa_inadimplencia') {
            this.updateInadimplenciaCard(update.data);
        }
    }
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', () => {
    new DashboardController();
});
```

---

## 📚 Referências

### Documentos Relacionados

- **Enums Confirmados**: `docs/ENUMS_CONFIRMADOS.md`
- **Constantes Python**: `app/constants/enums.py`
- **Especificação de KPIs V2**: `docs/KPI_CALCULATION_SPECIFICATION_V2.md`

### Fonte das Informações

- **Reunião FinanBlue**: 1 de novembro de 2025
- **Schema Database**: `schemas/schema.json`
- **Análise de Negócio**: `docs/analysis/Factoring_Business_Analysis.md`

---

## ✅ Checklist de Implementação

### Tela 1: Visão Executiva (2-3 dias)

- [ ] KPI 1.1: Volume de Operações (Card + Line Chart)
- [ ] KPI 1.2: Taxa de Inadimplência (Card + Gauge Chart)
- [ ] KPI 1.3: ROI (Card + Bar Chart)
- [ ] KPI 1.4: Ticket Médio (Card + Line Chart)
- [ ] Filtros de período
- [ ] Exportação de dados

### Tela 2: Análise de Clientes (3-4 dias)

- [ ] KPI 2.1: Ranking de Clientes (Tabela + Bar Chart)
- [ ] KPI 2.2: Taxa de Inadimplência por Cliente (Tabela + Scatter)
- [ ] KPI 2.3: Distribuição por Faixa de Volume (Pie Chart)
- [ ] KPI 2.4: Score de Risco (Tabela + Heat Map)
- [ ] KPI 2.5: Análise de Churn (Tabela + Funnel)
- [ ] Exportação de e-mails para campanha

### Tela 3: Desempenho de Agentes (3-4 dias)

- [ ] KPI 3.1: Ranking de Agentes (Tabela + Bar Chart)
- [ ] KPI 3.2: Carteira de Clientes (Tabela + Bubble Chart)
- [ ] KPI 3.3: Operações Abertas (Tabela + Stacked Bar)
- [ ] KPI 3.4: Taxa de Conversão (Bar Chart)
- [ ] KPI 3.5: Evolução Temporal (Multi-line Chart)

### Tela 4: Análise de Risco (4-5 dias)

- [ ] KPI 4.1: Aging de Documentos (Stacked Bar + Tabela)
- [ ] KPI 4.2: Taxa de Perda (Card + Line Chart)
- [ ] KPI 4.3: Distribuição de Baixas (Pie Chart + Tabela)
- [ ] KPI 4.4: Concentração por Sacado (Tabela + Treemap)
- [ ] KPI 4.5: Provisão para Perdas (Card + Area Chart)

---

**Documento validado e pronto para implementação**  
**Última atualização**: 1 de novembro de 2025  
**Autor**: Dashboard Fonte Team  
**Versão**: 3.0 (Final)

