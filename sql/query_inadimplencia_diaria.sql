-- ============================================================================
-- QUERY: TAXA DE INADIMPLÊNCIA DIÁRIA
-- ============================================================================
-- Esta query calcula a taxa de inadimplência para cada DIA do período.
-- Retorna APENAS DIAS ÚTEIS (sem sábados e domingos).
--
-- LÓGICA:
-- - Documento inadimplente de (vencimento + 1 dia) até (pagamento - 1 dia)
-- - Vencimento em fim de semana é ajustado para próxima segunda
-- - Exemplo: vence dia 1, pago dia 4 → inadimplente dias 2 e 3
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

-- Query final: taxa de inadimplência por dia (apenas dias úteis)
SELECT 
    dvpd.analysis_date as period_date,
    
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
WHERE dbo.fn_IsDiaUtilBancario(dvpd.analysis_date) = 1  -- Filtrar apenas dias úteis (sem sábados e domingos)
GROUP BY dvpd.analysis_date, dapd.total_active_documents, dapd.total_active_value
ORDER BY dvpd.analysis_date

OPTION (MAXRECURSION 0);  -- Permitir recursão ilimitada para DateSeries

-- ============================================================================
-- FORMATO DE RETORNO
-- ============================================================================

/*
period_date | overdue_documents | total_active_documents | default_rate_percent
------------|-------------------|------------------------|---------------------
2024-01-02  | 15                | 250                    | 6.00  (terça-feira)
2024-01-03  | 18                | 252                    | 7.14  (quarta-feira)
2024-01-04  | 12                | 248                    | 4.84  (quinta-feira)
2024-01-05  | 20                | 255                    | 7.84  (sexta-feira)
2024-01-08  | 22                | 258                    | 8.53  (segunda-feira - pula fim de semana)
...

NOTA: Sábados e domingos NÃO aparecem no resultado
*/

-- ============================================================================
-- EXEMPLOS DE USO
-- ============================================================================

/*
-- Exemplo 1: Taxa diária dos últimos 30 dias
DECLARE @DataInicio DATE = DATEADD(DAY, -30, GETDATE());
DECLARE @DataFim DATE = GETDATE();
-- Executar query acima

-- Exemplo 2: Taxa diária do último ano
DECLARE @DataInicio DATE = DATEADD(YEAR, -1, GETDATE());
DECLARE @DataFim DATE = GETDATE();
-- Executar query acima

-- Exemplo 3: Taxa diária de 2024
DECLARE @DataInicio DATE = '2024-01-01';
DECLARE @DataFim DATE = '2024-12-31';
-- Executar query acima
*/

-- ============================================================================
-- USO NO BACKEND (Python)
-- ============================================================================

/*
# app/services/inadimplencia_service.py
def get_taxa_inadimplencia_diaria(self, start_date, end_date):
    with open('sql/query_inadimplencia_diaria.sql', 'r') as f:
        query = f.read()
    
    query = query.replace('@DataInicio', f"'{start_date}'")
    query = query.replace('@DataFim', f"'{end_date}'")
    
    return self.db.execute_query(text(query))

# Rota Flask
@kpi_bp.route('/inadimplencia-diaria', methods=['GET'])
def get_inadimplencia_diaria():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    result = inadimplencia_service.get_taxa_inadimplencia_diaria(start_date, end_date)
    
    return jsonify({'success': True, 'data': result})
*/

-- ============================================================================
-- USO NO FRONTEND (Chart.js)
-- ============================================================================

/*
// Buscar dados
const response = await fetch('/api/kpi/inadimplencia-diaria?start_date=2024-01-01&end_date=2025-11-01');
const data = await response.json();

// Criar gráfico de linha
new Chart(ctx, {
    type: 'line',
    data: {
        labels: data.data.map(d => {
            const date = new Date(d.period_date);
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }),
        datasets: [{
            label: 'Taxa de Inadimplência (%)',
            data: data.data.map(d => d.default_rate_percent),
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            tension: 0.4,
            fill: true
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
        }
    }
});
*/

-- ============================================================================
-- PERFORMANCE
-- ============================================================================

/*
RECOMENDAÇÕES:
- Períodos < 90 dias: Excelente performance (2-5 segundos)
- Períodos 90-365 dias: Boa performance (5-15 segundos)
- Períodos > 365 dias: Use query mensal (query_inadimplencia_mensal.sql)

ÍNDICES RECOMENDADOS:
CREATE INDEX IX_Documento_DataVencimento ON Documento(DataVencimento) WHERE IsDeleted = 0;
CREATE INDEX IX_Documento_DataBaixa ON Documento(DataBaixa) WHERE IsDeleted = 0;
CREATE INDEX IX_Documento_DataEmissao ON Documento(DataEmissao) WHERE IsDeleted = 0;
CREATE INDEX IX_Documento_Status ON Documento(Status) WHERE IsDeleted = 0;
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

