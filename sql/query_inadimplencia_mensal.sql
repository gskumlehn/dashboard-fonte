-- ============================================================================
-- QUERY: TAXA DE INADIMPLÊNCIA MENSAL
-- ============================================================================
-- Esta query calcula a taxa MÉDIA de inadimplência para cada MÊS do período.
-- Calcula a média das taxas diárias (apenas dias úteis) de cada mês.
--
-- LÓGICA:
-- - Calcula taxa diária para cada dia útil
-- - Agrupa por mês e calcula média, máxima e mínima
-- - Retorna estatísticas mensais
-- ============================================================================

-- ============================================================================
-- PARÂMETROS
-- ============================================================================
DECLARE @DataInicio DATE = '2024-01-01';
DECLARE @DataFim DATE = '2025-11-01';

-- ============================================================================
-- QUERY PRINCIPAL
-- ============================================================================

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
    -- Calcular taxa diária (apenas dias úteis)
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
    WHERE dbo.fn_IsDiaUtilBancario(dvpd.analysis_date) = 1  -- Filtrar apenas dias úteis
    GROUP BY dvpd.analysis_date, dvpd.year, dvpd.month, dapd.total_active_documents, dapd.total_active_value
)

-- Agregar por mês
SELECT 
    DATEFROMPARTS(year, month, 1) as period_date,
    year,
    month,
    
    -- Médias mensais
    AVG(overdue_documents) as avg_overdue_documents,
    AVG(total_active_documents) as avg_total_documents,
    AVG(overdue_value) as avg_overdue_value,
    AVG(total_active_value) as avg_total_value,
    
    -- Taxa média de inadimplência do mês (por quantidade)
    AVG(default_rate_percent) as avg_default_rate_percent,
    
    -- Taxa média de inadimplência do mês (por valor)
    AVG(default_rate_value_percent) as avg_default_rate_value_percent,
    
    -- Máxima e mínima do mês
    MAX(default_rate_percent) as max_default_rate_percent,
    MIN(default_rate_percent) as min_default_rate_percent,
    
    -- Total de dias úteis no mês
    COUNT(*) as business_days_in_month
    
FROM TaxaDiaria
GROUP BY year, month
ORDER BY year, month

OPTION (MAXRECURSION 0);

-- ============================================================================
-- FORMATO DE RETORNO
-- ============================================================================

/*
period_date | year | month | avg_default_rate_percent | max_default_rate_percent | min_default_rate_percent | business_days_in_month
------------|------|-------|--------------------------|--------------------------|--------------------------|------------------------
2024-01-01  | 2024 | 1     | 6.12                     | 8.50                     | 4.20                     | 23
2024-02-01  | 2024 | 2     | 7.45                     | 9.20                     | 5.80                     | 21
2024-03-01  | 2024 | 3     | 4.88                     | 6.10                     | 3.50                     | 21
2024-04-01  | 2024 | 4     | 5.23                     | 7.00                     | 4.10                     | 22
...

COLUNAS:
- period_date: Primeiro dia do mês
- year: Ano
- month: Mês (1-12)
- avg_default_rate_percent: Taxa média de inadimplência no mês
- max_default_rate_percent: Pico de inadimplência no mês
- min_default_rate_percent: Menor taxa no mês
- business_days_in_month: Quantidade de dias úteis analisados
*/

-- ============================================================================
-- EXEMPLOS DE USO
-- ============================================================================

/*
-- Exemplo 1: Taxa mensal dos últimos 12 meses
DECLARE @DataInicio DATE = DATEADD(MONTH, -12, GETDATE());
DECLARE @DataFim DATE = GETDATE();
-- Executar query acima

-- Exemplo 2: Taxa mensal dos últimos 2 anos
DECLARE @DataInicio DATE = DATEADD(YEAR, -2, GETDATE());
DECLARE @DataFim DATE = GETDATE();
-- Executar query acima

-- Exemplo 3: Taxa mensal de 2024
DECLARE @DataInicio DATE = '2024-01-01';
DECLARE @DataFim DATE = '2024-12-31';
-- Executar query acima
*/

-- ============================================================================
-- USO NO BACKEND (Python)
-- ============================================================================

/*
# app/services/inadimplencia_service.py
def get_taxa_inadimplencia_mensal(self, start_date, end_date):
    with open('sql/query_inadimplencia_mensal.sql', 'r') as f:
        query = f.read()
    
    query = query.replace('@DataInicio', f"'{start_date}'")
    query = query.replace('@DataFim', f"'{end_date}'")
    
    return self.db.execute_query(text(query))

# Rota Flask
@kpi_bp.route('/inadimplencia-mensal', methods=['GET'])
def get_inadimplencia_mensal():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    result = inadimplencia_service.get_taxa_inadimplencia_mensal(start_date, end_date)
    
    return jsonify({'success': True, 'data': result})
*/

-- ============================================================================
-- USO NO FRONTEND (Chart.js)
-- ============================================================================

/*
// Buscar dados
const response = await fetch('/api/kpi/inadimplencia-mensal?start_date=2024-01-01&end_date=2025-11-01');
const data = await response.json();

// Criar gráfico de barras
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: data.data.map(d => {
            const date = new Date(d.period_date);
            return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        }),
        datasets: [{
            label: 'Taxa Média (%)',
            data: data.data.map(d => d.avg_default_rate_percent),
            backgroundColor: '#dc3545',
            borderColor: '#c82333',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: { callback: (value) => value.toFixed(1) + '%' }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const idx = context.dataIndex;
                        const item = data.data[idx];
                        return [
                            `Taxa Média: ${item.avg_default_rate_percent.toFixed(2)}%`,
                            `Máxima: ${item.max_default_rate_percent.toFixed(2)}%`,
                            `Mínima: ${item.min_default_rate_percent.toFixed(2)}%`,
                            `Dias úteis: ${item.business_days_in_month}`
                        ];
                    }
                }
            }
        }
    }
});
*/

-- ============================================================================
-- PERFORMANCE
-- ============================================================================

/*
RECOMENDAÇÕES:
- Períodos < 12 meses: Excelente performance (5-10 segundos)
- Períodos 12-24 meses: Boa performance (10-20 segundos)
- Períodos > 24 meses: Performance aceitável (20-40 segundos)

VANTAGENS DO AGRUPAMENTO MENSAL:
- Reduz volume de dados retornados
- Melhor para visualização de tendências de longo prazo
- Suaviza variações diárias
- Mais rápido que agrupamento diário para períodos longos

ÍNDICES RECOMENDADOS:
CREATE INDEX IX_Documento_DataVencimento ON Documento(DataVencimento) WHERE IsDeleted = 0;
CREATE INDEX IX_Documento_DataBaixa ON Documento(DataBaixa) WHERE IsDeleted = 0;
CREATE INDEX IX_Documento_DataEmissao ON Documento(DataEmissao) WHERE IsDeleted = 0;
CREATE INDEX IX_Documento_Status ON Documento(Status) WHERE IsDeleted = 0;
*/

-- ============================================================================
-- INTERPRETAÇÃO DOS RESULTADOS
-- ============================================================================

/*
EXEMPLO DE ANÁLISE:

period_date | avg_default_rate_percent | max_default_rate_percent | min_default_rate_percent
------------|--------------------------|--------------------------|-------------------------
2024-01-01  | 6.12                     | 8.50                     | 4.20
2024-02-01  | 7.45                     | 9.20                     | 5.80

INTERPRETAÇÃO:
- Janeiro: Taxa média de 6.12%, com pico de 8.50% e mínimo de 4.20%
  → Variação de 4.30 pontos percentuais (8.50 - 4.20)
  → Indica volatilidade moderada

- Fevereiro: Taxa média de 7.45%, com pico de 9.20% e mínimo de 5.80%
  → Variação de 3.40 pontos percentuais (9.20 - 5.80)
  → Indica volatilidade menor que janeiro, mas taxa média mais alta

INSIGHTS:
- Taxa média aumentou 1.33 pontos percentuais (de 6.12% para 7.45%)
- Pico de inadimplência aumentou 0.70 pontos percentuais
- Situação piorou em fevereiro, mas com menor volatilidade
*/

-- ============================================================================
-- DEPENDÊNCIAS
-- ============================================================================

/*
REQUER:
- Função fn_DataVencimentoAjustada(@DataVencimento)
- Função fn_IsDiaUtilBancario(@Data)

EXECUTAR ANTES:
- sql/funcoes_dias_uteis_simples.sql
*/

-- ============================================================================
-- COMPARAÇÃO COM QUERY DIÁRIA
-- ============================================================================

/*
QUANDO USAR CADA QUERY:

QUERY DIÁRIA (query_inadimplencia_diaria.sql):
✅ Análise de curto prazo (< 90 dias)
✅ Identificar variações diárias
✅ Monitoramento operacional
✅ Detectar anomalias pontuais
✅ Avaliar impacto de ações imediatas

QUERY MENSAL (query_inadimplencia_mensal.sql):
✅ Análise de longo prazo (> 90 dias)
✅ Identificar tendências mensais
✅ Análise estratégica
✅ Relatórios executivos
✅ Comparações ano a ano
✅ Planejamento e projeções
*/

