-- ============================================================================
-- QUERY: TAXA DE INADIMPLÊNCIA AO LONGO DO TEMPO
-- ============================================================================
-- Esta query calcula a taxa de inadimplência para cada período (dia ou mês),
-- considerando:
-- 1. Data de vencimento ajustada (sábado/domingo → próxima segunda)
-- 2. Data de baixa do documento
-- 3. Um documento está inadimplente entre: (vencimento ajustado + 1 dia) até (data de baixa - 1 dia)
-- 4. Exemplo: Vence dia 1 (sexta), pago dia 4 (segunda) → inadimplente dias 2 e 3 (sábado e domingo não contam)
-- 5. Agrupamento por dia ou por mês conforme parâmetro
-- ============================================================================

-- ============================================================================
-- PARÂMETROS
-- ============================================================================
DECLARE @DataInicio DATE = '2024-01-01';
DECLARE @DataFim DATE = '2025-11-01';
DECLARE @Agrupamento VARCHAR(10) = 'DIA';  -- 'DIA' ou 'MES'

-- ============================================================================
-- VERSÃO 1: AGRUPAMENTO POR DIA
-- ============================================================================
-- Use esta query quando @Agrupamento = 'DIA'
-- Retorna taxa de inadimplência para cada dia do período
-- ============================================================================

IF @Agrupamento = 'DIA'
BEGIN
    WITH DateSeries AS (
        -- Gerar série de datas (todos os dias do período)
        SELECT @DataInicio AS analysis_date
        UNION ALL
        SELECT DATEADD(DAY, 1, analysis_date)
        FROM DateSeries
        WHERE analysis_date < @DataFim
    ),
    
    DocumentosAjustados AS (
        -- Calcular datas ajustadas e período de inadimplência
        SELECT 
            d.Id as document_id,
            d.Numero as document_number,
            d.DataVencimento as original_due_date,
            d.DataBaixa as payment_date,
            d.Valor as document_value,
            d.Status as document_status,
            
            -- Data de vencimento ajustada (próximo dia útil se fim de semana)
            dbo.fn_DataVencimentoAjustada(d.DataVencimento) as adjusted_due_date,
            
            -- Data a partir da qual o documento está vencido (dia seguinte ao vencimento ajustado)
            DATEADD(DAY, 1, dbo.fn_DataVencimentoAjustada(d.DataVencimento)) as overdue_start_date,
            
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
          -- Considerar apenas documentos que podem ter estado vencidos no período
          AND d.DataVencimento <= @DataFim
          AND (d.DataBaixa IS NULL OR d.DataBaixa >= @DataInicio)
    ),
    
    DocumentosVencidosPorDia AS (
        -- Para cada dia, verificar quais documentos estavam vencidos
        SELECT 
            ds.analysis_date,
            da.document_id,
            da.document_value,
            da.original_due_date,
            da.adjusted_due_date,
            da.payment_date,
            
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
    
    DocumentosAtivosPorDia AS (
        -- Para cada dia, contar documentos ativos (denominador)
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
    
    -- Query final: taxa de inadimplência por dia
    SELECT 
        dvpd.analysis_date as period_date,
        'DIA' as period_type,
        
        -- Contagem de documentos
        COUNT(DISTINCT CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_id END) as overdue_documents,
        dapd.total_active_documents,
        
        -- Valores
        SUM(CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_value ELSE 0 END) as overdue_value,
        dapd.total_active_value,
        
        -- Taxa de inadimplência (percentual por quantidade)
        CASE 
            WHEN dapd.total_active_documents > 0 THEN
                CAST(COUNT(DISTINCT CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_id END) AS FLOAT) * 100.0 
                / dapd.total_active_documents
            ELSE 0
        END as default_rate_percent,
        
        -- Taxa de inadimplência (percentual por valor)
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
END

-- ============================================================================
-- VERSÃO 2: AGRUPAMENTO POR MÊS
-- ============================================================================
-- Use esta query quando @Agrupamento = 'MES'
-- Retorna taxa média de inadimplência para cada mês do período
-- ============================================================================

IF @Agrupamento = 'MES'
BEGIN
    WITH DateSeries AS (
        -- Gerar série de datas (todos os dias do período)
        SELECT @DataInicio AS analysis_date
        UNION ALL
        SELECT DATEADD(DAY, 1, analysis_date)
        FROM DateSeries
        WHERE analysis_date < @DataFim
    ),
    
    DocumentosAjustados AS (
        -- Calcular datas ajustadas e período de inadimplência
        SELECT 
            d.Id as document_id,
            d.Numero as document_number,
            d.DataVencimento as original_due_date,
            d.DataBaixa as payment_date,
            d.Valor as document_value,
            d.Status as document_status,
            
            -- Data de vencimento ajustada (próximo dia útil se fim de semana)
            dbo.fn_DataVencimentoAjustada(d.DataVencimento) as adjusted_due_date,
            
            -- Data a partir da qual o documento está vencido
            DATEADD(DAY, 1, dbo.fn_DataVencimentoAjustada(d.DataVencimento)) as overdue_start_date,
            
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
    
    DocumentosVencidosPorDia AS (
        -- Para cada dia, verificar quais documentos estavam vencidos
        SELECT 
            ds.analysis_date,
            DATEPART(YEAR, ds.analysis_date) as year,
            DATEPART(MONTH, ds.analysis_date) as month,
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
        WHERE 
            ds.analysis_date >= da.overdue_start_date
            AND ds.analysis_date <= da.overdue_end_date
    ),
    
    DocumentosAtivosPorDia AS (
        -- Para cada dia, contar documentos ativos
        SELECT 
            ds.analysis_date,
            DATEPART(YEAR, ds.analysis_date) as year,
            DATEPART(MONTH, ds.analysis_date) as month,
            COUNT(DISTINCT d.Id) as total_active_documents,
            SUM(d.Valor) as total_active_value
        FROM DateSeries ds
        CROSS JOIN Documento d
        WHERE d.IsDeleted = 0
          AND d.DataEmissao <= ds.analysis_date
          AND (d.DataBaixa IS NULL OR d.DataBaixa > ds.analysis_date)
        GROUP BY ds.analysis_date, DATEPART(YEAR, ds.analysis_date), DATEPART(MONTH, ds.analysis_date)
    ),
    
    TaxaDiaria AS (
        -- Calcular taxa diária
        SELECT 
            dvpd.analysis_date,
            dvpd.year,
            dvpd.month,
            COUNT(DISTINCT CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_id END) as overdue_documents,
            dapd.total_active_documents,
            SUM(CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_value ELSE 0 END) as overdue_value,
            dapd.total_active_value,
            
            CASE 
                WHEN dapd.total_active_documents > 0 THEN
                    CAST(COUNT(DISTINCT CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_id END) AS FLOAT) * 100.0 
                    / dapd.total_active_documents
                ELSE 0
            END as default_rate_percent,
            
            CASE 
                WHEN dapd.total_active_value > 0 THEN
                    SUM(CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_value ELSE 0 END) * 100.0 
                    / dapd.total_active_value
                ELSE 0
            END as default_rate_value_percent
            
        FROM DocumentosVencidosPorDia dvpd
        INNER JOIN DocumentosAtivosPorDia dapd 
            ON dvpd.analysis_date = dapd.analysis_date
        GROUP BY dvpd.analysis_date, dvpd.year, dvpd.month, dapd.total_active_documents, dapd.total_active_value
    )
    
    -- Agregar por mês
    SELECT 
        DATEFROMPARTS(year, month, 1) as period_date,
        'MES' as period_type,
        year,
        month,
        
        -- Médias mensais
        AVG(overdue_documents) as avg_overdue_documents,
        AVG(total_active_documents) as avg_total_documents,
        AVG(overdue_value) as avg_overdue_value,
        AVG(total_active_value) as avg_total_value,
        
        -- Taxa média de inadimplência do mês
        AVG(default_rate_percent) as avg_default_rate_percent,
        AVG(default_rate_value_percent) as avg_default_rate_value_percent,
        
        -- Máxima e mínima do mês
        MAX(default_rate_percent) as max_default_rate_percent,
        MIN(default_rate_percent) as min_default_rate_percent,
        
        -- Total de dias no mês
        COUNT(*) as days_in_month
        
    FROM TaxaDiaria
    GROUP BY year, month
    ORDER BY year, month
    
    OPTION (MAXRECURSION 0);
END

-- ============================================================================
-- VERSÃO SIMPLIFICADA: QUERY ÚNICA COM CASE
-- ============================================================================
-- Esta versão permite escolher o agrupamento dinamicamente
-- ============================================================================

/*
WITH DateSeries AS (
    SELECT @DataInicio AS analysis_date
    UNION ALL
    SELECT DATEADD(DAY, 1, analysis_date)
    FROM DateSeries
    WHERE analysis_date < @DataFim
),

DocumentosAjustados AS (
    SELECT 
        d.Id as document_id,
        d.Valor as document_value,
        dbo.fn_DataVencimentoAjustada(d.DataVencimento) as adjusted_due_date,
        DATEADD(DAY, 1, dbo.fn_DataVencimentoAjustada(d.DataVencimento)) as overdue_start_date,
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
),

TaxaDiaria AS (
    SELECT 
        dvpd.analysis_date,
        COUNT(DISTINCT CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_id END) as overdue_documents,
        dapd.total_active_documents,
        SUM(CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_value ELSE 0 END) as overdue_value,
        dapd.total_active_value,
        CASE 
            WHEN dapd.total_active_documents > 0 THEN
                CAST(COUNT(DISTINCT CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_id END) AS FLOAT) * 100.0 
                / dapd.total_active_documents
            ELSE 0
        END as default_rate_percent
    FROM DocumentosVencidosPorDia dvpd
    INNER JOIN DocumentosAtivosPorDia dapd ON dvpd.analysis_date = dapd.analysis_date
    GROUP BY dvpd.analysis_date, dapd.total_active_documents, dapd.total_active_value
)

-- Retornar resultado baseado no agrupamento
SELECT 
    CASE 
        WHEN @Agrupamento = 'DIA' THEN analysis_date
        WHEN @Agrupamento = 'MES' THEN DATEFROMPARTS(DATEPART(YEAR, analysis_date), DATEPART(MONTH, analysis_date), 1)
    END as period_date,
    @Agrupamento as period_type,
    
    CASE 
        WHEN @Agrupamento = 'DIA' THEN overdue_documents
        WHEN @Agrupamento = 'MES' THEN AVG(overdue_documents)
    END as overdue_documents,
    
    CASE 
        WHEN @Agrupamento = 'DIA' THEN total_active_documents
        WHEN @Agrupamento = 'MES' THEN AVG(total_active_documents)
    END as total_active_documents,
    
    CASE 
        WHEN @Agrupamento = 'DIA' THEN default_rate_percent
        WHEN @Agrupamento = 'MES' THEN AVG(default_rate_percent)
    END as default_rate_percent

FROM TaxaDiaria
GROUP BY 
    CASE 
        WHEN @Agrupamento = 'DIA' THEN analysis_date
        WHEN @Agrupamento = 'MES' THEN DATEFROMPARTS(DATEPART(YEAR, analysis_date), DATEPART(MONTH, analysis_date), 1)
    END,
    CASE WHEN @Agrupamento = 'DIA' THEN overdue_documents ELSE NULL END,
    CASE WHEN @Agrupamento = 'DIA' THEN total_active_documents ELSE NULL END,
    CASE WHEN @Agrupamento = 'DIA' THEN default_rate_percent ELSE NULL END
ORDER BY period_date

OPTION (MAXRECURSION 0);
*/

-- ============================================================================
-- EXEMPLOS DE USO
-- ============================================================================

/*
-- Exemplo 1: Taxa de inadimplência diária do último ano
DECLARE @DataInicio DATE = DATEADD(YEAR, -1, GETDATE());
DECLARE @DataFim DATE = GETDATE();
DECLARE @Agrupamento VARCHAR(10) = 'DIA';
-- Executar query acima

-- Exemplo 2: Taxa de inadimplência mensal dos últimos 2 anos
DECLARE @DataInicio DATE = DATEADD(YEAR, -2, GETDATE());
DECLARE @DataFim DATE = GETDATE();
DECLARE @Agrupamento VARCHAR(10) = 'MES';
-- Executar query acima

-- Exemplo 3: Taxa de inadimplência diária de um período específico
DECLARE @DataInicio DATE = '2024-01-01';
DECLARE @DataFim DATE = '2024-12-31';
DECLARE @Agrupamento VARCHAR(10) = 'DIA';
-- Executar query acima
*/

-- ============================================================================
-- FORMATO DE RETORNO
-- ============================================================================

/*
AGRUPAMENTO POR DIA:
period_date         | period_type | overdue_documents | total_active_documents | default_rate_percent
--------------------|-------------|-------------------|------------------------|---------------------
2024-01-01          | DIA         | 15                | 250                    | 6.00
2024-01-02          | DIA         | 18                | 252                    | 7.14
2024-01-03          | DIA         | 12                | 248                    | 4.84
...

AGRUPAMENTO POR MÊS:
period_date | period_type | year | month | avg_overdue_documents | avg_default_rate_percent | max_default_rate_percent
------------|-------------|------|-------|-----------------------|--------------------------|-------------------------
2024-01-01  | MES         | 2024 | 1     | 15.3                  | 6.12                     | 8.50
2024-02-01  | MES         | 2024 | 2     | 18.7                  | 7.45                     | 9.20
2024-03-01  | MES         | 2024 | 3     | 12.1                  | 4.88                     | 6.10
...
*/

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
1. PERFORMANCE:
   - Para períodos longos (> 1 ano), prefira agrupamento mensal
   - Considere criar índices:
     CREATE INDEX IX_Documento_DataVencimento ON Documento(DataVencimento) WHERE IsDeleted = 0;
     CREATE INDEX IX_Documento_DataBaixa ON Documento(DataBaixa) WHERE IsDeleted = 0;
     CREATE INDEX IX_Documento_DataEmissao ON Documento(DataEmissao) WHERE IsDeleted = 0;

2. LÓGICA DE INADIMPLÊNCIA:
   - Documento vence no sábado → vencimento ajustado para segunda
   - Inadimplente a partir do dia SEGUINTE ao vencimento ajustado
   - Deixa de ser inadimplente no dia do pagamento (não no dia anterior)
   - Exemplo: Vence 01/out (sexta), pago 04/out (segunda) → inadimplente 02/out e 03/out

3. DIAS ÚTEIS:
   - Apenas sábados e domingos são considerados não úteis
   - Feriados NÃO são considerados nesta versão
   - Para adicionar feriados, execute sql/create_feriados_bancarios.sql

4. CHART.JS:
   - Para gráfico de linha, use period_date como labels
   - Para gráfico de barras, use default_rate_percent como data
   - Formato de data: 'DD/MM/YYYY' para dia, 'MM/YYYY' para mês
*/

