-- ============================================================================
-- QUERY: TAXA DE INADIMPLÊNCIA HISTÓRICA DIÁRIA
-- ============================================================================
-- Esta query calcula a taxa de inadimplência para cada dia do período,
-- considerando:
-- 1. Data de vencimento ajustada (próximo dia útil se cair em fim de semana/feriado)
-- 2. Data de baixa do documento
-- 3. Um documento está inadimplente entre: (vencimento ajustado + 1 dia) até (data de baixa - 1 dia)
-- 4. Exemplo: Vencido em 01/out, pago em 10/out → inadimplente de 02/out a 09/out
-- ============================================================================

-- Parâmetros:
-- @DataInicio: Data inicial do período de análise
-- @DataFim: Data final do período de análise
-- @Estado: Estado para considerar feriados estaduais (opcional)
-- @Cidade: Cidade para considerar feriados municipais (opcional)

DECLARE @DataInicio DATE = '2024-11-01';
DECLARE @DataFim DATE = '2025-11-01';
DECLARE @Estado NVARCHAR(2) = NULL;  -- Ex: 'SP'
DECLARE @Cidade NVARCHAR(100) = NULL;  -- Ex: 'São Paulo'

-- ============================================================================
-- CTE 1: Gerar série de datas (todos os dias do período)
-- ============================================================================
WITH DateSeries AS (
    SELECT @DataInicio AS analysis_date
    UNION ALL
    SELECT DATEADD(DAY, 1, analysis_date)
    FROM DateSeries
    WHERE analysis_date < @DataFim
),

-- ============================================================================
-- CTE 2: Documentos com datas ajustadas
-- ============================================================================
DocumentosAjustados AS (
    SELECT 
        d.Id as document_id,
        d.Numero as document_number,
        d.DataVencimento as original_due_date,
        d.DataBaixa as payment_date,
        d.Valor as document_value,
        d.Status as document_status,
        
        -- Data de vencimento ajustada (próximo dia útil se cair em fim de semana/feriado)
        dbo.fn_DataVencimentoAjustada(d.DataVencimento, @Estado, @Cidade) as adjusted_due_date,
        
        -- Data a partir da qual o documento está vencido (dia seguinte ao vencimento ajustado)
        DATEADD(DAY, 1, dbo.fn_DataVencimentoAjustada(d.DataVencimento, @Estado, @Cidade)) as overdue_start_date,
        
        -- Data até a qual o documento está vencido
        CASE 
            -- Se foi baixado, fica vencido até o dia anterior à baixa
            WHEN d.DataBaixa IS NOT NULL THEN DATEADD(DAY, -1, d.DataBaixa)
            -- Se ainda não foi baixado, fica vencido até hoje
            ELSE CAST(GETDATE() AS DATE)
        END as overdue_end_date
        
    FROM Documento d
    WHERE d.IsDeleted = 0
      AND d.DataVencimento IS NOT NULL
      -- Considerar apenas documentos que podem ter estado vencidos no período de análise
      AND d.DataVencimento <= @DataFim
      AND (d.DataBaixa IS NULL OR d.DataBaixa >= @DataInicio)
),

-- ============================================================================
-- CTE 3: Documentos vencidos por dia
-- ============================================================================
DocumentosVencidosPorDia AS (
    SELECT 
        ds.analysis_date,
        da.document_id,
        da.document_value,
        da.original_due_date,
        da.adjusted_due_date,
        da.payment_date,
        da.overdue_start_date,
        da.overdue_end_date,
        
        -- Verificar se o documento estava vencido neste dia
        CASE 
            WHEN ds.analysis_date >= da.overdue_start_date 
             AND ds.analysis_date <= da.overdue_end_date
            THEN 1
            ELSE 0
        END as is_overdue_on_date
        
    FROM DateSeries ds
    CROSS JOIN DocumentosAjustados da
    WHERE 
        -- Otimização: apenas documentos que podem estar vencidos neste dia
        ds.analysis_date >= da.overdue_start_date
        AND ds.analysis_date <= da.overdue_end_date
),

-- ============================================================================
-- CTE 4: Documentos ativos por dia (denominador)
-- ============================================================================
DocumentosAtivosPorDia AS (
    SELECT 
        ds.analysis_date,
        COUNT(DISTINCT d.Id) as total_active_documents,
        SUM(d.Valor) as total_active_value
    FROM DateSeries ds
    CROSS JOIN Documento d
    WHERE d.IsDeleted = 0
      AND d.DataEmissao <= ds.analysis_date  -- Documento já foi emitido
      AND (
          -- Documento ainda não foi baixado OU foi baixado depois deste dia
          d.DataBaixa IS NULL 
          OR d.DataBaixa > ds.analysis_date
      )
    GROUP BY ds.analysis_date
)

-- ============================================================================
-- QUERY FINAL: Taxa de inadimplência por dia
-- ============================================================================
SELECT 
    dvpd.analysis_date,
    
    -- Contagem de documentos
    COUNT(DISTINCT CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_id END) as overdue_documents,
    dapd.total_active_documents,
    
    -- Valores
    SUM(CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_value ELSE 0 END) as overdue_value,
    dapd.total_active_value,
    
    -- Taxa de inadimplência (percentual)
    CASE 
        WHEN dapd.total_active_documents > 0 THEN
            CAST(COUNT(DISTINCT CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_id END) AS FLOAT) * 100.0 
            / dapd.total_active_documents
        ELSE 0
    END as default_rate_percent,
    
    -- Taxa de inadimplência por valor (percentual)
    CASE 
        WHEN dapd.total_active_value > 0 THEN
            SUM(CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_value ELSE 0 END) * 100.0 
            / dapd.total_active_value
        ELSE 0
    END as default_rate_value_percent

FROM DocumentosVencidosPorDia dvpd
INNER JOIN DocumentosAtivosPorDia dapd ON dvpd.analysis_date = dapd.analysis_date
GROUP BY dvpd.analysis_date, dapd.total_active_documents, dapd.total_active_value
ORDER BY dvpd.analysis_date

OPTION (MAXRECURSION 0);  -- Permitir recursão ilimitada para DateSeries

-- ============================================================================
-- QUERY ALTERNATIVA: Taxa de inadimplência ATUAL (snapshot de hoje)
-- ============================================================================

/*
SELECT 
    COUNT(DISTINCT CASE WHEN is_overdue = 1 THEN d.Id END) as overdue_documents,
    COUNT(DISTINCT d.Id) as total_documents,
    SUM(CASE WHEN is_overdue = 1 THEN d.Valor ELSE 0 END) as overdue_value,
    SUM(d.Valor) as total_value,
    
    -- Taxa de inadimplência atual
    CAST(COUNT(DISTINCT CASE WHEN is_overdue = 1 THEN d.Id END) AS FLOAT) * 100.0 
        / NULLIF(COUNT(DISTINCT d.Id), 0) as default_rate_percent,
    
    -- Taxa de inadimplência por valor
    SUM(CASE WHEN is_overdue = 1 THEN d.Valor ELSE 0 END) * 100.0 
        / NULLIF(SUM(d.Valor), 0) as default_rate_value_percent

FROM (
    SELECT 
        d.Id,
        d.Valor,
        d.DataVencimento,
        d.DataBaixa,
        d.Status,
        dbo.fn_DataVencimentoAjustada(d.DataVencimento, @Estado, @Cidade) as adjusted_due_date,
        
        -- Verificar se está vencido HOJE
        CASE 
            WHEN d.Status = 0  -- Aberto
             AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, @Estado, @Cidade)
            THEN 1
            ELSE 0
        END as is_overdue
        
    FROM Documento d
    WHERE d.IsDeleted = 0
      AND d.DataVencimento IS NOT NULL
) d;
*/

-- ============================================================================
-- QUERY PARA CHART.JS: Dados agregados por semana/mês
-- ============================================================================

/*
-- Agregação SEMANAL
SELECT 
    DATEPART(YEAR, analysis_date) as year,
    DATEPART(WEEK, analysis_date) as week,
    MIN(analysis_date) as week_start_date,
    MAX(analysis_date) as week_end_date,
    AVG(default_rate_percent) as avg_default_rate,
    MAX(default_rate_percent) as max_default_rate,
    MIN(default_rate_percent) as min_default_rate
FROM (
    -- Query principal aqui
) daily_data
GROUP BY DATEPART(YEAR, analysis_date), DATEPART(WEEK, analysis_date)
ORDER BY year, week;

-- Agregação MENSAL
SELECT 
    DATEPART(YEAR, analysis_date) as year,
    DATEPART(MONTH, analysis_date) as month,
    DATEFROMPARTS(DATEPART(YEAR, analysis_date), DATEPART(MONTH, analysis_date), 1) as month_start_date,
    AVG(default_rate_percent) as avg_default_rate,
    MAX(default_rate_percent) as max_default_rate,
    MIN(default_rate_percent) as min_default_rate,
    SUM(overdue_documents) as total_overdue_documents,
    SUM(overdue_value) as total_overdue_value
FROM (
    -- Query principal aqui
) daily_data
GROUP BY DATEPART(YEAR, analysis_date), DATEPART(MONTH, analysis_date)
ORDER BY year, month;
*/

-- ============================================================================
-- EXEMPLOS DE TESTES
-- ============================================================================

/*
-- Teste 1: Verificar documentos vencidos em uma data específica
DECLARE @DataTeste DATE = '2025-10-05';

SELECT 
    d.Id,
    d.Numero,
    d.DataVencimento as original_due_date,
    dbo.fn_DataVencimentoAjustada(d.DataVencimento, NULL, NULL) as adjusted_due_date,
    d.DataBaixa as payment_date,
    d.Valor,
    CASE 
        WHEN @DataTeste > dbo.fn_DataVencimentoAjustada(d.DataVencimento, NULL, NULL)
         AND (d.DataBaixa IS NULL OR @DataTeste < d.DataBaixa)
        THEN 'VENCIDO'
        ELSE 'EM DIA'
    END as status_on_date
FROM Documento d
WHERE d.IsDeleted = 0
  AND d.DataVencimento IS NOT NULL
  AND d.DataVencimento <= @DataTeste
  AND (d.DataBaixa IS NULL OR d.DataBaixa >= @DataTeste)
ORDER BY d.DataVencimento;
*/

