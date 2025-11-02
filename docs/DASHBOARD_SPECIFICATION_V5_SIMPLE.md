# Dashboard Fonte 

---

## 🎯 Conceitos Importantes

## 📊 TELA 1: Visão Executiva

### KPI 1.2: Taxa de Inadimplência ATUAL

**Descrição**: Taxa de inadimplência no momento atual (snapshot de hoje).

**Query SQL**:
```sql
SELECT 
    COUNT(DISTINCT CASE WHEN is_overdue = 1 THEN d.Id END) as overdue_documents,
    COUNT(DISTINCT d.Id) as total_documents,
    SUM(CASE WHEN is_overdue = 1 THEN d.Valor ELSE 0 END) as overdue_value,
    SUM(d.Valor) as total_value,
    
    -- Taxa de inadimplência (por quantidade)
    CAST(COUNT(DISTINCT CASE WHEN is_overdue = 1 THEN d.Id END) AS FLOAT) * 100.0 
        / NULLIF(COUNT(DISTINCT d.Id), 0) as default_rate_percent,
    
    -- Taxa de inadimplência (por valor)
    SUM(CASE WHEN is_overdue = 1 THEN d.Valor ELSE 0 END) * 100.0 
        / NULLIF(SUM(d.Valor), 0) as default_rate_value_percent

FROM (
    SELECT 
        d.Id,
        d.Valor,
        d.Status,
        
        -- Verificar se está vencido HOJE
        CASE 
            WHEN d.Status = 0  -- Only consider documents with status "Aberto"
             AND CAST(GETDATE() AS DATE) > 
                 (CASE 
                    WHEN DATEPART(WEEKDAY, CAST(d.DataVencimento AS DATE)) = 7 
                        THEN DATEADD(DAY, 2, CAST(d.DataVencimento AS DATE))  -- Saturday -> Monday
                    WHEN DATEPART(WEEKDAY, CAST(d.DataVencimento AS DATE)) = 1 
                        THEN DATEADD(DAY, 1, CAST(d.DataVencimento AS DATE))  -- Sunday -> Monday
                    ELSE CAST(d.DataVencimento AS DATE)
                  END)
            THEN 1
            ELSE 0
        END as is_overdue
        
    FROM Documento d
    WHERE d.IsDeleted = 0
      AND d.Status = 0  -- Only include documents with status "Aberto"
      AND d.DataVencimento IS NOT NULL
) d;
```

**Tipo de Gráfico**: Card + Gauge Chart

**Chart.js Config**:
```javascript
{
  type: 'doughnut',
  data: {
    labels: ['Inadimplente', 'Em Dia'],
    datasets: [{
      data: [default_rate_percent, 100 - default_rate_percent],
      backgroundColor: ['#dc3545', '#28a745'],
      borderWidth: 0
    }]
  },
  options: {
    circumference: 180,
    rotation: -90,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => context.label + ': ' + context.parsed.toFixed(2) + '%'
        }
      }
    }
  }
}
```

---

### KPI 1.2B: Taxa de Inadimplência HISTÓRICA

**Descrição**: Taxa de inadimplência dia a dia ao longo de um período.

**Query SQL**:
```sql
DECLARE @DataInicio DATE = :start_date;
DECLARE @DataFim DATE = :end_date;

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
        
        -- Início do período de inadimplência
        DATEADD(DAY, 1, dbo.fn_DataVencimentoAjustada(d.DataVencimento)) as overdue_start_date,
        
        -- Fim do período de inadimplência
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
)

SELECT 
    dvpd.analysis_date,
    COUNT(DISTINCT CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_id END) as overdue_documents,
    dapd.total_active_documents,
    SUM(CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_value ELSE 0 END) as overdue_value,
    dapd.total_active_value,
    
    -- Taxa de inadimplência
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

**Tipo de Gráfico**: Line Chart

**Chart.js Config**:
```javascript
{
  type: 'line',
  data: {
    labels: dates,  // ['2024-11-01', '2024-11-02', ...]
    datasets: [{
      label: 'Taxa de Inadimplência (%)',
      data: rates,  // [2.5, 2.7, 2.3, ...]
      borderColor: '#dc3545',
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 2,
      pointHoverRadius: 5
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
    }
  }
}
```

---

### KPI 1.3: ROI

**Sem mudanças** - Não depende de views nem de dias úteis.

---

### KPI 1.4: Ticket Médio

**Sem mudanças** - Não depende de views nem de dias úteis.

---

## 📊 TELA 2: Análise de Clientes

### KPI 2.1: Ranking de Clientes por Volume

**Sem mudanças** - Não depende de views nem de dias úteis.

---

### KPI 2.2: Taxa de Inadimplência por Cliente

**Query SQL**:
```sql
SELECT 
    cb.Id as client_id,
    cb.Razao as client_name,
    cb.Email as client_email,
    
    COUNT(d.Id) as total_documents,
    
    -- Documentos vencidos
    COUNT(CASE 
        WHEN d.Status = 0
         AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento)
        THEN 1 
    END) as overdue_documents,
    
    -- Valor vencido
    SUM(CASE 
        WHEN d.Status = 0
         AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento)
        THEN d.Valor 
        ELSE 0 
    END) as overdue_value,
    
    -- Taxa de inadimplência
    CAST(COUNT(CASE 
        WHEN d.Status = 0
         AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento)
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

---

### KPI 2.4: Score de Risco por Cliente

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
             AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento)
            THEN 1 
        END) as overdue_documents,
        
        -- Média de dias de atraso
        AVG(CASE 
            WHEN d.Status = 0
             AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento)
            THEN DATEDIFF(DAY, dbo.fn_DataVencimentoAjustada(d.DataVencimento), GETDATE())
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
    
    -- Score de Risco (0-100)
    (
        (CAST(overdue_documents AS FLOAT) / NULLIF(total_documents, 0) * 40) +
        (CASE WHEN avg_delay_days > 90 THEN 30 
              WHEN avg_delay_days > 60 THEN 20 
              WHEN avg_delay_days > 30 THEN 10 
              ELSE 0 END) +
        (CAST(loss_count AS FLOAT) / NULLIF(total_documents, 0) * 20) +
        (CASE WHEN days_since_last_operation > 180 THEN 10 
              WHEN days_since_last_operation > 90 THEN 5 
              ELSE 0 END)
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
WHERE operation_count >= 3
ORDER BY risk_score DESC;
```

---

## 📊 TELA 4: Análise de Risco

### KPI 4.1: Aging de Documentos Vencidos

**Query SQL**:
```sql
WITH DocumentosVencidos AS (
    SELECT 
        d.Id,
        d.Numero,
        d.Valor,
        d.DataVencimento,
        dbo.fn_DataVencimentoAjustada(d.DataVencimento) as adjusted_due_date,
        
        -- Calcular dias de atraso
        DATEDIFF(DAY, 
            dbo.fn_DataVencimentoAjustada(d.DataVencimento), 
            GETDATE()
        ) as days_overdue
        
    FROM Documento d
    WHERE d.IsDeleted = 0
      AND d.Status = 0  -- Aberto
      AND d.DataVencimento IS NOT NULL
      AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento)
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
    
    def get_taxa_inadimplencia_atual(self):
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
                         AND CAST(GETDATE() AS DATE) > 
                             (CASE 
                                WHEN DATEPART(WEEKDAY, CAST(d.DataVencimento AS DATE)) = 7 
                                    THEN DATEADD(DAY, 2, CAST(d.DataVencimento AS DATE))  -- Saturday -> Monday
                                WHEN DATEPART(WEEKDAY, CAST(d.DataVencimento AS DATE)) = 1 
                                    THEN DATEADD(DAY, 1, CAST(d.DataVencimento AS DATE))  -- Sunday -> Monday
                                ELSE CAST(d.DataVencimento AS DATE)
                              END)
                        THEN 1
                        ELSE 0
                    END as is_overdue
                FROM Documento d
                WHERE d.IsDeleted = :is_deleted
                  AND d.Status = 0  -- Only include documents with status "Aberto"
                  AND d.DataVencimento IS NOT NULL
            ) d
        """)
        
        params = {'is_deleted': IsDeleted.ATIVO}
        
        result = self.db.execute_query(query, params)
        return result[0] if result else None
    
    def get_taxa_inadimplencia_historica(self, start_date, end_date):
        """Taxa de inadimplência histórica dia a dia"""
        query = text("""
            -- Query completa de inadimplência histórica
            -- (Ver seção KPI 1.2B acima)
        """)
        
        params = {
            'start_date': start_date,
            'end_date': end_date
        }
        
        return self.db.execute_query(query, params)
```

---

## ✅ Checklist de Implementação

### Setup Inicial
- [ ] Executar `sql/funcoes_dias_uteis_simples.sql` no SQL Server
- [ ] Verificar se as 3 funções foram criadas
- [ ] Testar funções com casos de teste

### Tela 1: Visão Executiva
- [ ] KPI 1.1: Volume de Operações
- [ ] KPI 1.2: Taxa de Inadimplência Atual
- [ ] KPI 1.2B: Taxa de Inadimplência Histórica
- [ ] KPI 1.3: ROI
- [ ] KPI 1.4: Ticket Médio

### Tela 2: Análise de Clientes
- [ ] KPI 2.2: Taxa de Inadimplência por Cliente
- [ ] KPI 2.4: Score de Risco

### Tela 4: Análise de Risco
- [ ] KPI 4.1: Aging de Documentos

---

## 📝 Notas Importantes

### Sobre Feriados

Esta versão **não considera feriados bancários**. Apenas fins de semana (sábado e domingo) são tratados como dias não úteis.

**Impacto**: A taxa de inadimplência pode estar ligeiramente diferente da realidade em períodos com muitos feriados.

**Solução futura**: Adicionar tabela `FeriadosBancarios` e atualizar funções SQL quando necessário.

---

**Documento validado e pronto para implementação**  
**Última atualização**: 1 de novembro de 2025  
**Autor**: Dashboard Fonte Team  
**Versão**: 5.0 (Simplificada - Sem Feriados)
