# Dashboard Fonte - Especificação Técnica V4

**Data**: 1 de novembro de 2025  
**Versão**: 4.0 (Sem Views + Inadimplência Histórica)  
**Status**: ✅ Pronto para Implementação

---

## 📋 Mudanças da V3 para V4

### ❌ Removido
- Uso de `ViewDocumentoAtrasoCalculo` e outras views
- Queries que dependem de views pré-existentes

### ✅ Adicionado
- **Tabela `FeriadosBancarios`** para cálculo de dias úteis
- **Funções SQL** para verificação de dias úteis bancários
- **Query de inadimplência histórica diária** (taxa dia a dia)
- **Lógica de vencimento ajustado** (fim de semana → próxima segunda)
- **Consideração de feriados bancários** nacionais, estaduais e municipais

---

## 🎯 Conceitos Importantes

### 1. Data de Vencimento Ajustada

**Regra**: Se um documento vence em fim de semana ou feriado, o vencimento é **automaticamente ajustado** para o próximo dia útil bancário.

**Exemplo**:
- Vencimento original: Sábado, 01/nov/2025
- Vencimento ajustado: Segunda, 03/nov/2025 (pula domingo 02/nov)

**Implementação**: Função `dbo.fn_DataVencimentoAjustada()`

---

### 2. Período de Inadimplência

**Regra**: Um documento está inadimplente entre:
- **Início**: Dia seguinte ao vencimento ajustado
- **Fim**: Dia anterior à data de baixa (ou hoje, se ainda não foi baixado)

**Exemplo**:
- Vencimento ajustado: 01/out/2025
- Data de baixa: 10/out/2025
- **Inadimplente de**: 02/out a 09/out (8 dias)

**Lógica**:
```
is_overdue = (data_analise > vencimento_ajustado) AND (data_analise < data_baixa)
```

---

### 3. Dias Úteis Bancários

**Não são dias úteis**:
- Sábados e domingos
- Feriados nacionais
- Feriados estaduais (se aplicável)
- Feriados municipais (se aplicável)

**Implementação**: Função `dbo.fn_IsDiaUtilBancario()`

---

## 🔧 Setup Inicial Obrigatório

### Passo 1: Criar Tabela de Feriados

```sql
-- Executar script completo
-- Arquivo: sql/create_feriados_bancarios.sql

-- Cria:
-- 1. Tabela FeriadosBancarios
-- 2. Função fn_IsDiaUtilBancario()
-- 3. Função fn_ProximoDiaUtilBancario()
-- 4. Função fn_DataVencimentoAjustada()
-- 5. Popula feriados 2024-2026
```

**⚠️ IMPORTANTE**: Execute este script **ANTES** de usar as queries do dashboard!

---

## 📊 TELA 1: Visão Executiva

### KPI 1.1: Volume de Operações

**Sem mudanças** - Não depende de views.

**Query SQL**:
```sql
SELECT 
    COUNT(o.Id) as total_operations,
    SUM(o.ValorCompra) as total_value,
    AVG(o.ValorCompra) as average_ticket
FROM Operacao o
WHERE o.Status = 1  -- Fechado
  AND o.IsDeleted = 0
  AND o.Data BETWEEN :start_date AND :end_date;
```

---

### KPI 1.2: Taxa de Inadimplência ATUAL

**Descrição**: Taxa de inadimplência no momento atual (snapshot de hoje).

**Cálculo**:
```
Taxa = (Documentos vencidos hoje / Total de documentos abertos) * 100
```

**Query SQL**:
```sql
SELECT 
    COUNT(DISTINCT CASE WHEN is_overdue = 1 THEN d.Id END) as overdue_documents,
    COUNT(DISTINCT d.Id) as total_documents,
    SUM(CASE WHEN is_overdue = 1 THEN d.Valor ELSE 0 END) as overdue_value,
    SUM(d.Valor) as total_value,
    
    -- Taxa de inadimplência atual (por quantidade)
    CAST(COUNT(DISTINCT CASE WHEN is_overdue = 1 THEN d.Id END) AS FLOAT) * 100.0 
        / NULLIF(COUNT(DISTINCT d.Id), 0) as default_rate_percent,
    
    -- Taxa de inadimplência atual (por valor)
    SUM(CASE WHEN is_overdue = 1 THEN d.Valor ELSE 0 END) * 100.0 
        / NULLIF(SUM(d.Valor), 0) as default_rate_value_percent

FROM (
    SELECT 
        d.Id,
        d.Valor,
        d.DataVencimento,
        d.DataBaixa,
        d.Status,
        dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade) as adjusted_due_date,
        
        -- Verificar se está vencido HOJE
        CASE 
            WHEN d.Status = 0  -- Aberto
             AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
            THEN 1
            ELSE 0
        END as is_overdue
        
    FROM Documento d
    WHERE d.IsDeleted = 0
      AND d.DataVencimento IS NOT NULL
) d;
```

**Parâmetros**:
- `:estado` - Sigla do estado (ex: 'SP') ou NULL
- `:cidade` - Nome da cidade (ex: 'São Paulo') ou NULL

**Tipo de Gráfico**: Card com indicador + Gauge Chart

---

### KPI 1.2B: Taxa de Inadimplência HISTÓRICA

**Descrição**: Taxa de inadimplência dia a dia ao longo de um período (ex: último ano).

**Cálculo**: Para cada dia do período, calcular quantos documentos estavam vencidos naquele dia específico.

**Query SQL** (versão simplificada para Chart.js):
```sql
-- Parâmetros
DECLARE @DataInicio DATE = :start_date;
DECLARE @DataFim DATE = :end_date;
DECLARE @Estado NVARCHAR(2) = :estado;
DECLARE @Cidade NVARCHAR(100) = :cidade;

-- CTE 1: Gerar série de datas
WITH DateSeries AS (
    SELECT @DataInicio AS analysis_date
    UNION ALL
    SELECT DATEADD(DAY, 1, analysis_date)
    FROM DateSeries
    WHERE analysis_date < @DataFim
),

-- CTE 2: Documentos com datas ajustadas
DocumentosAjustados AS (
    SELECT 
        d.Id as document_id,
        d.Valor as document_value,
        d.DataVencimento as original_due_date,
        d.DataBaixa as payment_date,
        
        -- Data de vencimento ajustada
        dbo.fn_DataVencimentoAjustada(d.DataVencimento, @Estado, @Cidade) as adjusted_due_date,
        
        -- Data a partir da qual o documento está vencido
        DATEADD(DAY, 1, dbo.fn_DataVencimentoAjustada(d.DataVencimento, @Estado, @Cidade)) as overdue_start_date,
        
        -- Data até a qual o documento está vencido
        CASE 
            WHEN d.DataBaixa IS NOT NULL THEN DATEADD(DAY, -1, d.DataBaixa)
            ELSE CAST(GETDATE() AS DATE)
        END as overdue_end_date
        
    FROM Documento d
    WHERE d.IsDeleted = 0
      AND d.DataVencimento IS NOT NULL
      AND d.DataVencimento <= @DataFim
      AND (d.DataBaixa IS NULL OR d.DataBaixa >= @DataInicio)
),

-- CTE 3: Documentos vencidos por dia
DocumentosVencidosPorDia AS (
    SELECT 
        ds.analysis_date,
        da.document_id,
        da.document_value,
        CASE 
            WHEN ds.analysis_date >= da.overdue_start_date 
             AND ds.analysis_date <= da.overdue_end_date
            THEN 1
            ELSE 0
        END as is_overdue_on_date
    FROM DateSeries ds
    CROSS JOIN DocumentosAjustados da
    WHERE ds.analysis_date >= da.overdue_start_date
      AND ds.analysis_date <= da.overdue_end_date
),

-- CTE 4: Documentos ativos por dia
DocumentosAtivosPorDia AS (
    SELECT 
        ds.analysis_date,
        COUNT(DISTINCT d.Id) as total_active_documents,
        SUM(d.Valor) as total_active_value
    FROM DateSeries ds
    CROSS JOIN Documento d
    WHERE d.IsDeleted = 0
      AND d.DataEmissao <= ds.analysis_date
      AND (d.DataBaixa IS NULL OR d.DataBaixa > ds.analysis_date)
    GROUP BY ds.analysis_date
)

-- Query final
SELECT 
    dvpd.analysis_date,
    COUNT(DISTINCT CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_id END) as overdue_documents,
    dapd.total_active_documents,
    SUM(CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_value ELSE 0 END) as overdue_value,
    dapd.total_active_value,
    
    -- Taxa de inadimplência (percentual)
    CASE 
        WHEN dapd.total_active_documents > 0 THEN
            CAST(COUNT(DISTINCT CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_id END) AS FLOAT) * 100.0 
            / dapd.total_active_documents
        ELSE 0
    END as default_rate_percent

FROM DocumentosVencidosPorDia dvpd
INNER JOIN DocumentosAtivosPorDia dapd ON dvpd.analysis_date = dapd.analysis_date
GROUP BY dvpd.analysis_date, dapd.total_active_documents, dapd.total_active_value
ORDER BY dvpd.analysis_date

OPTION (MAXRECURSION 0);
```

**Parâmetros**:
- `:start_date` - Data inicial (ex: '2024-11-01')
- `:end_date` - Data final (ex: '2025-11-01')
- `:estado` - Sigla do estado ou NULL
- `:cidade` - Nome da cidade ou NULL

**Tipo de Gráfico**: Line Chart (evolução temporal)

**Chart.js Config**:
```javascript
{
  type: 'line',
  data: {
    labels: dates,  // ['2024-11-01', '2024-11-02', ...]
    datasets: [{
      label: 'Taxa de Inadimplência (%)',
      data: default_rates,  // [2.5, 2.7, 2.3, ...]
      borderColor: '#dc3545',
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      tension: 0.4,
      fill: true
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => value + '%'
        }
      },
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'DD/MM'
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            return 'Taxa: ' + context.parsed.y.toFixed(2) + '%';
          }
        }
      }
    }
  }
}
```

**Observação**: Para períodos longos (> 90 dias), considere agregar por semana ou mês para melhor performance e visualização.

---

### KPI 1.2C: Taxa de Inadimplência Agregada (Semanal/Mensal)

**Query SQL (Agregação Mensal)**:
```sql
-- Usar a query histórica acima e adicionar agregação:

SELECT 
    DATEPART(YEAR, analysis_date) as year,
    DATEPART(MONTH, analysis_date) as month,
    DATEFROMPARTS(DATEPART(YEAR, analysis_date), DATEPART(MONTH, analysis_date), 1) as month_start_date,
    
    AVG(default_rate_percent) as avg_default_rate,
    MAX(default_rate_percent) as max_default_rate,
    MIN(default_rate_percent) as min_default_rate,
    
    AVG(overdue_documents) as avg_overdue_documents,
    AVG(total_active_documents) as avg_total_documents

FROM (
    -- Query histórica completa aqui (CTEs + SELECT final)
) daily_data

GROUP BY DATEPART(YEAR, analysis_date), DATEPART(MONTH, analysis_date)
ORDER BY year, month;
```

**Tipo de Gráfico**: Bar Chart (média mensal)

---

### KPI 1.3: ROI

**Sem mudanças** - Não depende de views.

---

### KPI 1.4: Ticket Médio

**Sem mudanças** - Não depende de views.

---

## 📊 TELA 2: Análise de Clientes

### KPI 2.1: Ranking de Clientes por Volume

**Sem mudanças** - Não depende de views.

---

### KPI 2.2: Taxa de Inadimplência por Cliente

**Descrição**: Taxa de inadimplência atual de cada cliente.

**Query SQL**:
```sql
SELECT 
    cb.Id as client_id,
    cb.Razao as client_name,
    cb.Email as client_email,
    
    COUNT(d.Id) as total_documents,
    
    -- Documentos vencidos (usando lógica direta)
    COUNT(CASE 
        WHEN d.Status = 0  -- Aberto
         AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
        THEN 1 
    END) as overdue_documents,
    
    -- Valor vencido
    SUM(CASE 
        WHEN d.Status = 0
         AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
        THEN d.Valor 
        ELSE 0 
    END) as overdue_value,
    
    -- Taxa de inadimplência
    CAST(COUNT(CASE 
        WHEN d.Status = 0
         AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
        THEN 1 
    END) AS FLOAT) * 100.0 / NULLIF(COUNT(d.Id), 0) as default_rate

FROM CadastroBase cb
INNER JOIN Operacao o ON cb.Id = o.ClienteId
INNER JOIN Documento d ON o.Id = d.OperacaoId
WHERE d.IsDeleted = 0
  AND o.IsDeleted = 0
  AND cb.IsDeleted = 0
  AND d.DataVencimento IS NOT NULL
GROUP BY cb.Id, cb.Razao, cb.Email
HAVING COUNT(d.Id) >= :min_documents  -- Ex: 5
ORDER BY default_rate DESC
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;
```

**Parâmetros**:
- `:estado` - Sigla do estado ou NULL
- `:cidade` - Nome da cidade ou NULL
- `:min_documents` - Mínimo de documentos para análise (ex: 5)

---

### KPI 2.3: Distribuição por Faixa de Volume

**Sem mudanças** - Não depende de views.

---

### KPI 2.4: Score de Risco por Cliente

**Atualização**: Substituir cálculo de `avg_delay_days` para usar lógica direta.

**Query SQL**:
```sql
WITH ClienteMetrics AS (
    SELECT 
        cb.Id as client_id,
        cb.Razao as client_name,
        COUNT(DISTINCT o.Id) as operation_count,
        SUM(o.ValorCompra) as total_volume,
        COUNT(d.Id) as total_documents,
        
        -- Documentos vencidos
        COUNT(CASE 
            WHEN d.Status = 0
             AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
            THEN 1 
        END) as overdue_documents,
        
        -- Média de dias de atraso (documentos vencidos)
        AVG(CASE 
            WHEN d.Status = 0
             AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
            THEN DATEDIFF(DAY, dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade), GETDATE())
            ELSE 0
        END) as avg_delay_days,
        
        -- Documentos com perda
        COUNT(CASE WHEN d.TipoBaixa = 4 THEN 1 END) as loss_count,
        
        -- Dias desde última operação
        DATEDIFF(DAY, MAX(o.Data), GETDATE()) as days_since_last_operation
        
    FROM CadastroBase cb
    INNER JOIN Operacao o ON cb.Id = o.ClienteId
    INNER JOIN Documento d ON o.Id = d.OperacaoId
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
    avg_delay_days,
    loss_count,
    days_since_last_operation,
    
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
    
    -- Categoria de risco
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
WHERE operation_count >= 3  -- Mínimo 3 operações
ORDER BY risk_score DESC;
```

---

### KPI 2.5: Análise de Churn

**Sem mudanças** - Não depende de views.

---

## 📊 TELA 3: Desempenho de Agentes

**Sem mudanças** - Nenhum KPI desta tela depende de views.

---

## 📊 TELA 4: Análise de Risco

### KPI 4.1: Aging de Documentos Vencidos

**Descrição**: Distribuição de documentos vencidos por faixa de atraso.

**Query SQL**:
```sql
WITH DocumentosVencidos AS (
    SELECT 
        d.Id,
        d.Numero,
        d.Valor,
        d.DataVencimento,
        dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade) as adjusted_due_date,
        
        -- Calcular dias de atraso
        DATEDIFF(DAY, 
            dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade), 
            GETDATE()
        ) as days_overdue
        
    FROM Documento d
    WHERE d.IsDeleted = 0
      AND d.Status = 0  -- Aberto
      AND d.DataVencimento IS NOT NULL
      AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
)
SELECT 
    CASE 
        WHEN days_overdue <= 30 THEN '0-30 dias'
        WHEN days_overdue <= 60 THEN '31-60 dias'
        WHEN days_overdue <= 90 THEN '61-90 dias'
        WHEN days_overdue <= 180 THEN '91-180 dias'
        ELSE '> 180 dias'
    END as aging_range,
    
    COUNT(Id) as document_count,
    SUM(Valor) as total_value,
    AVG(days_overdue) as avg_delay_days,
    MIN(days_overdue) as min_delay_days,
    MAX(days_overdue) as max_delay_days

FROM DocumentosVencidos
GROUP BY 
    CASE 
        WHEN days_overdue <= 30 THEN '0-30 dias'
        WHEN days_overdue <= 60 THEN '31-60 dias'
        WHEN days_overdue <= 90 THEN '61-90 dias'
        WHEN days_overdue <= 180 THEN '91-180 dias'
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

**Tipo de Gráfico**: Stacked Bar Chart

---

### KPI 4.2: Taxa de Perda

**Sem mudanças** - Não depende de views.

---

### KPI 4.3: Distribuição de Tipos de Baixa

**Sem mudanças** - Não depende de views.

---

### KPI 4.4: Concentração de Risco por Sacado

**Query SQL**:
```sql
SELECT 
    s.Id as debtor_id,
    s.Razao as debtor_name,
    COUNT(d.Id) as total_documents,
    SUM(d.Valor) as total_exposure,
    
    -- Documentos vencidos
    COUNT(CASE 
        WHEN d.Status = 0
         AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
        THEN 1 
    END) as overdue_count,
    
    -- Valor vencido
    SUM(CASE 
        WHEN d.Status = 0
         AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
        THEN d.Valor 
        ELSE 0 
    END) as overdue_value,
    
    -- Taxa de inadimplência
    CAST(COUNT(CASE 
        WHEN d.Status = 0
         AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
        THEN 1 
    END) AS FLOAT) * 100.0 / NULLIF(COUNT(d.Id), 0) as default_rate

FROM Documento d
INNER JOIN CadastroBase s ON d.SacadoId = s.Id
WHERE d.Status = 0  -- Aberto
  AND d.IsDeleted = 0
  AND s.IsDeleted = 0
  AND d.DataVencimento IS NOT NULL
GROUP BY s.Id, s.Razao
HAVING SUM(d.Valor) > :min_exposure  -- Ex: 10000
ORDER BY total_exposure DESC
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;
```

---

### KPI 4.5: Provisão para Perdas

**Query SQL**:
```sql
WITH DocumentosRisco AS (
    SELECT 
        d.Id,
        d.Valor,
        d.DataVencimento,
        dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade) as adjusted_due_date,
        
        -- Calcular dias de atraso
        DATEDIFF(DAY, 
            dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade), 
            GETDATE()
        ) as days_overdue,
        
        -- Taxa de provisão baseada em dias de atraso
        CASE 
            WHEN DATEDIFF(DAY, dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade), GETDATE()) > 180 
                THEN 1.0  -- 100% provisão
            WHEN DATEDIFF(DAY, dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade), GETDATE()) > 90 
                THEN 0.75  -- 75% provisão
            WHEN DATEDIFF(DAY, dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade), GETDATE()) > 60 
                THEN 0.50  -- 50% provisão
            WHEN DATEDIFF(DAY, dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade), GETDATE()) > 30 
                THEN 0.25  -- 25% provisão
            ELSE 0.0
        END as provision_rate
        
    FROM Documento d
    WHERE d.Status = 0  -- Aberto
      AND d.IsDeleted = 0
      AND d.DataVencimento IS NOT NULL
      AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
)
SELECT 
    COUNT(*) as at_risk_documents,
    SUM(Valor) as total_at_risk,
    SUM(Valor * provision_rate) as total_provision,
    AVG(days_overdue) as avg_delay_days,
    
    -- Provisão por faixa
    SUM(CASE WHEN days_overdue <= 30 THEN Valor * provision_rate ELSE 0 END) as provision_0_30,
    SUM(CASE WHEN days_overdue > 30 AND days_overdue <= 60 THEN Valor * provision_rate ELSE 0 END) as provision_31_60,
    SUM(CASE WHEN days_overdue > 60 AND days_overdue <= 90 THEN Valor * provision_rate ELSE 0 END) as provision_61_90,
    SUM(CASE WHEN days_overdue > 90 AND days_overdue <= 180 THEN Valor * provision_rate ELSE 0 END) as provision_91_180,
    SUM(CASE WHEN days_overdue > 180 THEN Valor * provision_rate ELSE 0 END) as provision_180_plus

FROM DocumentosRisco;
```

---

## 🔧 Implementação Backend (Python)

### Serviço de Inadimplência

```python
# app/services/inadimplencia_service.py
from sqlalchemy import text
from app.infra.db_connection import Database
from app.constants.enums import DocumentoStatus, IsDeleted

class InadimplenciaService:
    def __init__(self):
        self.db = Database()
    
    def get_taxa_inadimplencia_atual(self, estado=None, cidade=None):
        """Taxa de inadimplência atual (snapshot de hoje)"""
        query = text("""
            SELECT 
                COUNT(DISTINCT CASE WHEN is_overdue = 1 THEN d.Id END) as overdue_documents,
                COUNT(DISTINCT d.Id) as total_documents,
                SUM(CASE WHEN is_overdue = 1 THEN d.Valor ELSE 0 END) as overdue_value,
                SUM(d.Valor) as total_value,
                CAST(COUNT(DISTINCT CASE WHEN is_overdue = 1 THEN d.Id END) AS FLOAT) * 100.0 
                    / NULLIF(COUNT(DISTINCT d.Id), 0) as default_rate_percent
            FROM (
                SELECT 
                    d.Id,
                    d.Valor,
                    CASE 
                        WHEN d.Status = 0
                         AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
                        THEN 1
                        ELSE 0
                    END as is_overdue
                FROM Documento d
                WHERE d.IsDeleted = :is_deleted
                  AND d.DataVencimento IS NOT NULL
            ) d
        """)
        
        params = {
            'estado': estado,
            'cidade': cidade,
            'is_deleted': IsDeleted.ATIVO
        }
        
        result = self.db.execute_query(query, params)
        return result[0] if result else None
    
    def get_taxa_inadimplencia_historica(self, start_date, end_date, estado=None, cidade=None):
        """Taxa de inadimplência histórica dia a dia"""
        # Ver query completa em sql/query_inadimplencia_historica.sql
        query = text("""
            -- Query completa aqui (muito longa para incluir inline)
            -- Retorna: analysis_date, overdue_documents, total_documents, default_rate_percent
        """)
        
        params = {
            'start_date': start_date,
            'end_date': end_date,
            'estado': estado,
            'cidade': cidade
        }
        
        return self.db.execute_query(query, params)
```

---

## 📚 Arquivos de Referência

### Scripts SQL

1. **`sql/create_feriados_bancarios.sql`**
   - Criar tabela FeriadosBancarios
   - Criar funções de dias úteis
   - Popular feriados 2024-2026

2. **`sql/query_inadimplencia_historica.sql`**
   - Query completa de inadimplência histórica
   - Exemplos de uso
   - Testes

### Documentos

- **Enums Confirmados**: `docs/ENUMS_CONFIRMADOS.md`
- **Constantes Python**: `app/constants/enums.py`
- **Especificação V3**: `docs/DASHBOARD_SPECIFICATION_FINAL.md` (versão anterior)

---

## ✅ Checklist de Implementação

### Setup Inicial
- [ ] Executar `sql/create_feriados_bancarios.sql` no banco
- [ ] Testar funções de dias úteis
- [ ] Validar feriados cadastrados

### Tela 1: Visão Executiva
- [ ] KPI 1.1: Volume de Operações (sem mudanças)
- [ ] KPI 1.2: Taxa de Inadimplência Atual (nova query)
- [ ] KPI 1.2B: Taxa de Inadimplência Histórica (nova query)
- [ ] KPI 1.2C: Agregação Mensal (nova query)
- [ ] KPI 1.3: ROI (sem mudanças)
- [ ] KPI 1.4: Ticket Médio (sem mudanças)

### Tela 2: Análise de Clientes
- [ ] KPI 2.2: Taxa de Inadimplência por Cliente (query atualizada)
- [ ] KPI 2.4: Score de Risco (query atualizada)

### Tela 4: Análise de Risco
- [ ] KPI 4.1: Aging de Documentos (query atualizada)
- [ ] KPI 4.4: Concentração por Sacado (query atualizada)
- [ ] KPI 4.5: Provisão para Perdas (query atualizada)

---

**Documento validado e pronto para implementação**  
**Última atualização**: 1 de novembro de 2025  
**Autor**: Dashboard Fonte Team  
**Versão**: 4.0 (Final - Sem Views)

