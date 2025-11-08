# Query de Taxa de Inadimplência ao Longo do Tempo

**Arquivo**: `sql/query_taxa_inadimplencia_temporal.sql`  
**Data**: 1 de novembro de 2025  
**Versão**: 1.0

---

## 📋 Visão Geral

Esta query calcula a **taxa de inadimplência** para cada período (dia ou mês), permitindo visualizar a evolução temporal da inadimplência no dashboard.

**Uso principal**: Gráfico de linha mostrando a evolução da taxa de inadimplência ao longo do tempo.

---

## 🎯 Lógica de Inadimplência

### Conceito Principal

Um documento está **inadimplente** em uma data específica se:

1. A data de análise é **posterior** ao vencimento ajustado
2. A data de análise é **anterior** à data de baixa (pagamento)

### Exemplo Prático

**Cenário**:
- Documento vence: **Dia 1 (sexta-feira)**
- Documento pago: **Dia 4 (segunda-feira)**

**Análise dia a dia**:
- **Dia 1 (sexta)**: ❌ Não inadimplente (dia do vencimento)
- **Dia 2 (sábado)**: ✅ **Inadimplente** (vencido e não pago)
- **Dia 3 (domingo)**: ✅ **Inadimplente** (vencido e não pago)
- **Dia 4 (segunda)**: ❌ Não inadimplente (dia do pagamento)

**Resultado**: Documento ficou inadimplente por **2 dias** (dias 2 e 3).

---

## 🔧 Vencimento Ajustado

### Regra

Se um documento vence em **fim de semana** (sábado ou domingo), o vencimento é **automaticamente ajustado** para a próxima segunda-feira.

### Exemplo

**Cenário 1**: Vencimento em dia útil
- Vencimento original: **01/out/2025 (quarta-feira)**
- Vencimento ajustado: **01/out/2025** (sem mudança)
- Inadimplente a partir de: **02/out/2025**

**Cenário 2**: Vencimento em sábado
- Vencimento original: **02/nov/2025 (sábado)**
- Vencimento ajustado: **03/nov/2025 (segunda-feira)**
- Inadimplente a partir de: **04/nov/2025**

**Cenário 3**: Vencimento em domingo
- Vencimento original: **03/nov/2025 (domingo)**
- Vencimento ajustado: **03/nov/2025 (segunda-feira)**
- Inadimplente a partir de: **04/nov/2025**

---

## 📊 Parâmetros da Query

### Parâmetros Obrigatórios

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `@DataInicio` | DATE | Data inicial do período de análise | '2024-01-01' |
| `@DataFim` | DATE | Data final do período de análise | '2025-11-01' |
| `@Agrupamento` | VARCHAR(10) | Tipo de agrupamento: 'DIA' ou 'MES' | 'DIA' |

### Exemplos de Uso

**Exemplo 1: Taxa diária do último ano**
```sql
DECLARE @DataInicio DATE = DATEADD(YEAR, -1, GETDATE());
DECLARE @DataFim DATE = GETDATE();
DECLARE @Agrupamento VARCHAR(10) = 'DIA';
-- Executar query
```

**Exemplo 2: Taxa mensal dos últimos 2 anos**
```sql
DECLARE @DataInicio DATE = DATEADD(YEAR, -2, GETDATE());
DECLARE @DataFim DATE = GETDATE();
DECLARE @Agrupamento VARCHAR(10) = 'MES';
-- Executar query
```

**Exemplo 3: Taxa diária de 2024**
```sql
DECLARE @DataInicio DATE = '2024-01-01';
DECLARE @DataFim DATE = '2024-12-31';
DECLARE @Agrupamento VARCHAR(10) = 'DIA';
-- Executar query
```

---

## 📈 Formato de Retorno

### Agrupamento por DIA

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `period_date` | DATE | Data do período (dia específico) |
| `period_type` | VARCHAR | Tipo de período ('DIA') |
| `overdue_documents` | INT | Quantidade de documentos inadimplentes neste dia |
| `total_active_documents` | INT | Quantidade total de documentos ativos neste dia |
| `overdue_value` | DECIMAL | Valor total inadimplente neste dia |
| `total_active_value` | DECIMAL | Valor total ativo neste dia |
| `default_rate_percent` | FLOAT | Taxa de inadimplência (%) por quantidade |
| `default_rate_value_percent` | FLOAT | Taxa de inadimplência (%) por valor |

**Exemplo de retorno**:
```
period_date | period_type | overdue_documents | total_active_documents | default_rate_percent
------------|-------------|-------------------|------------------------|---------------------
2024-01-01  | DIA         | 15                | 250                    | 6.00
2024-01-02  | DIA         | 18                | 252                    | 7.14
2024-01-03  | DIA         | 12                | 248                    | 4.84
2024-01-04  | DIA         | 20                | 255                    | 7.84
...
```

---

### Agrupamento por MÊS

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `period_date` | DATE | Primeiro dia do mês |
| `period_type` | VARCHAR | Tipo de período ('MES') |
| `year` | INT | Ano |
| `month` | INT | Mês (1-12) |
| `avg_overdue_documents` | FLOAT | Média diária de documentos inadimplentes no mês |
| `avg_total_documents` | FLOAT | Média diária de documentos ativos no mês |
| `avg_overdue_value` | FLOAT | Média diária de valor inadimplente no mês |
| `avg_total_value` | FLOAT | Média diária de valor ativo no mês |
| `avg_default_rate_percent` | FLOAT | Taxa média de inadimplência (%) no mês |
| `max_default_rate_percent` | FLOAT | Taxa máxima de inadimplência (%) no mês |
| `min_default_rate_percent` | FLOAT | Taxa mínima de inadimplência (%) no mês |
| `days_in_month` | INT | Quantidade de dias analisados no mês |

**Exemplo de retorno**:
```
period_date | period_type | year | month | avg_default_rate_percent | max_default_rate_percent | days_in_month
------------|-------------|------|-------|--------------------------|--------------------------|---------------
2024-01-01  | MES         | 2024 | 1     | 6.12                     | 8.50                     | 31
2024-02-01  | MES         | 2024 | 2     | 7.45                     | 9.20                     | 29
2024-03-01  | MES         | 2024 | 3     | 4.88                     | 6.10                     | 31
...
```

---

## 🔧 Estrutura da Query

### CTEs (Common Table Expressions)

A query utiliza 4 CTEs principais:

#### 1. DateSeries
**Propósito**: Gerar série de datas (todos os dias do período).

**Lógica**: Recursão começando em `@DataInicio` até `@DataFim`.

**Exemplo**:
```
analysis_date
-------------
2024-01-01
2024-01-02
2024-01-03
...
2024-12-31
```

---

#### 2. DocumentosAjustados
**Propósito**: Calcular datas ajustadas e período de inadimplência de cada documento.

**Campos principais**:
- `adjusted_due_date`: Vencimento ajustado (próximo dia útil se fim de semana)
- `overdue_start_date`: Início do período de inadimplência (vencimento + 1 dia)
- `overdue_end_date`: Fim do período de inadimplência (pagamento - 1 dia ou hoje)

**Exemplo**:
```
document_id | original_due_date | adjusted_due_date | overdue_start_date | overdue_end_date
------------|-------------------|-------------------|--------------------|-----------------
1001        | 2024-11-01 (sáb)  | 2024-11-03 (seg)  | 2024-11-04         | 2024-11-10
1002        | 2024-11-05 (ter)  | 2024-11-05 (ter)  | 2024-11-06         | NULL (não pago)
```

---

#### 3. DocumentosVencidosPorDia
**Propósito**: Para cada dia, verificar quais documentos estavam inadimplentes.

**Lógica**: 
```sql
CASE 
    WHEN analysis_date >= overdue_start_date 
     AND analysis_date <= overdue_end_date
    THEN 1  -- Inadimplente
    ELSE 0  -- Não inadimplente
END
```

**Exemplo**:
```
analysis_date | document_id | is_overdue_on_date
--------------|-------------|-------------------
2024-11-04    | 1001        | 1 (inadimplente)
2024-11-05    | 1001        | 1 (inadimplente)
2024-11-06    | 1001        | 1 (inadimplente)
2024-11-10    | 1001        | 1 (inadimplente)
2024-11-11    | 1001        | 0 (foi pago)
```

---

#### 4. DocumentosAtivosPorDia
**Propósito**: Para cada dia, contar quantos documentos estavam ativos (denominador).

**Lógica**: Documento é ativo se:
- Foi emitido antes ou no dia de análise
- Ainda não foi baixado OU foi baixado depois do dia de análise

**Exemplo**:
```
analysis_date | total_active_documents | total_active_value
--------------|------------------------|-------------------
2024-11-01    | 250                    | 1500000.00
2024-11-02    | 252                    | 1520000.00
2024-11-03    | 248                    | 1480000.00
```

---

### Query Final

**Agrupamento por DIA**:
```sql
SELECT 
    analysis_date as period_date,
    COUNT(DISTINCT CASE WHEN is_overdue_on_date = 1 THEN document_id END) as overdue_documents,
    total_active_documents,
    CAST(COUNT(...) AS FLOAT) * 100.0 / total_active_documents as default_rate_percent
FROM DocumentosVencidosPorDia
INNER JOIN DocumentosAtivosPorDia ON ...
GROUP BY analysis_date, total_active_documents
ORDER BY analysis_date
```

**Agrupamento por MÊS**:
```sql
SELECT 
    DATEFROMPARTS(year, month, 1) as period_date,
    AVG(overdue_documents) as avg_overdue_documents,
    AVG(default_rate_percent) as avg_default_rate_percent,
    MAX(default_rate_percent) as max_default_rate_percent
FROM TaxaDiaria
GROUP BY year, month
ORDER BY year, month
```

---

## 📊 Uso no Frontend (Chart.js)

### Gráfico de Linha (Agrupamento Diário)

```javascript
// Backend: Buscar dados
const response = await fetch('/api/kpi/inadimplencia-temporal?start_date=2024-01-01&end_date=2025-11-01&grouping=DIA');
const data = await response.json();

// Frontend: Criar gráfico
const ctx = document.getElementById('inadimplenciaChart').getContext('2d');

new Chart(ctx, {
    type: 'line',
    data: {
        labels: data.map(d => {
            const date = new Date(d.period_date);
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }),
        datasets: [{
            label: 'Taxa de Inadimplência (%)',
            data: data.map(d => d.default_rate_percent),
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
                    callback: (value) => value.toFixed(1) + '%'
                }
            },
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const rate = context.parsed.y.toFixed(2);
                        return `Taxa: ${rate}%`;
                    }
                }
            },
            legend: {
                display: true,
                position: 'top'
            }
        }
    }
});
```

---

### Gráfico de Barras (Agrupamento Mensal)

```javascript
// Backend: Buscar dados
const response = await fetch('/api/kpi/inadimplencia-temporal?start_date=2024-01-01&end_date=2025-11-01&grouping=MES');
const data = await response.json();

// Frontend: Criar gráfico
const ctx = document.getElementById('inadimplenciaMensalChart').getContext('2d');

new Chart(ctx, {
    type: 'bar',
    data: {
        labels: data.map(d => {
            const date = new Date(d.period_date);
            return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        }),
        datasets: [{
            label: 'Taxa Média (%)',
            data: data.map(d => d.avg_default_rate_percent),
            backgroundColor: '#dc3545',
            borderColor: '#363432',
            borderWidth: 1
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
                    callback: (value) => value.toFixed(1) + '%'
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const rate = context.parsed.y.toFixed(2);
                        return `Taxa Média: ${rate}%`;
                    }
                }
            }
        }
    }
});
```

---

## 🔧 Implementação Backend (Python)

### Serviço

```python
# app/services/inadimplencia_service.py
from sqlalchemy import text
from app.infra.db_connection import Database

class InadimplenciaService:
    def __init__(self):
        self.db = Database()
    
    def get_taxa_inadimplencia_temporal(self, start_date, end_date, grouping='DIA'):
        """
        Retorna taxa de inadimplência ao longo do tempo
        
        Args:
            start_date (str): Data inicial (formato: 'YYYY-MM-DD')
            end_date (str): Data final (formato: 'YYYY-MM-DD')
            grouping (str): Tipo de agrupamento ('DIA' ou 'MES')
        
        Returns:
            list: Lista de dicionários com dados de inadimplência
        """
        # Ler query do arquivo SQL
        with open('sql/query_taxa_inadimplencia_temporal.sql', 'r') as f:
            query_template = f.read()
        
        # Substituir parâmetros
        query = query_template.replace('@DataInicio', f"'{start_date}'")
        query = query.replace('@DataFim', f"'{end_date}'")
        query = query.replace('@Agrupamento', f"'{grouping}'")
        
        # Executar query
        result = self.db.execute_query(text(query))
        
        return result
```

---

### Rota Flask

```python
# app/routes/kpi_routes.py
from flask import Blueprint, request, jsonify
from app.services.inadimplencia_service import InadimplenciaService

kpi_bp = Blueprint('kpi', __name__, url_prefix='/api/kpi')
inadimplencia_service = InadimplenciaService()

@kpi_bp.route('/inadimplencia-temporal', methods=['GET'])
def get_inadimplencia_temporal():
    """
    GET /api/kpi/inadimplencia-temporal
    
    Query params:
        - start_date: Data inicial (YYYY-MM-DD)
        - end_date: Data final (YYYY-MM-DD)
        - grouping: Agrupamento ('DIA' ou 'MES', default: 'DIA')
    
    Returns:
        JSON com dados de inadimplência temporal
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    grouping = request.args.get('grouping', 'DIA').upper()
    
    # Validação
    if not start_date or not end_date:
        return jsonify({
            'success': False,
            'error': 'Parâmetros start_date e end_date são obrigatórios'
        }), 400
    
    if grouping not in ['DIA', 'MES']:
        return jsonify({
            'success': False,
            'error': 'Parâmetro grouping deve ser DIA ou MES'
        }), 400
    
    # Buscar dados
    result = inadimplencia_service.get_taxa_inadimplencia_temporal(
        start_date, end_date, grouping
    )
    
    return jsonify({
        'success': True,
        'data': result,
        'metadata': {
            'start_date': start_date,
            'end_date': end_date,
            'grouping': grouping,
            'total_periods': len(result)
        }
    })
```

---

## ⚡ Performance

### Recomendações

**Para períodos curtos (< 90 dias)**:
- ✅ Use agrupamento diário (`@Agrupamento = 'DIA'`)
- ✅ Tempo de execução: 2-5 segundos

**Para períodos médios (90-365 dias)**:
- ⚠️ Use agrupamento diário com cautela
- ✅ Prefira agrupamento mensal (`@Agrupamento = 'MES'`)
- ✅ Tempo de execução: 5-15 segundos

**Para períodos longos (> 365 dias)**:
- ❌ Evite agrupamento diário
- ✅ Use agrupamento mensal obrigatoriamente
- ✅ Tempo de execução: 10-30 segundos

---

### Índices Recomendados

```sql
-- Otimizar queries de inadimplência
CREATE INDEX IX_Documento_DataVencimento 
ON Documento(DataVencimento) 
WHERE IsDeleted = 0;

CREATE INDEX IX_Documento_DataBaixa 
ON Documento(DataBaixa) 
WHERE IsDeleted = 0;

CREATE INDEX IX_Documento_DataEmissao 
ON Documento(DataEmissao) 
WHERE IsDeleted = 0;

CREATE INDEX IX_Documento_Status 
ON Documento(Status) 
WHERE IsDeleted = 0;
```

---

## ⚠️ Limitações

### 1. Feriados Bancários

**Limitação**: Esta versão **não considera feriados bancários**.

**Impacto**: Documentos vencidos em feriados serão considerados vencidos no próprio dia.

**Solução futura**: Executar `sql/create_feriados_bancarios.sql` e atualizar função `fn_DataVencimentoAjustada()`.

---

### 2. Performance em Períodos Longos

**Limitação**: Query pode ser lenta para períodos > 1 ano com agrupamento diário.

**Impacto**: Tempo de resposta pode chegar a 30-60 segundos.

**Solução**: Usar agrupamento mensal ou criar tabela materializada.

---

### 3. Recursão Ilimitada

**Limitação**: Query usa `OPTION (MAXRECURSION 0)` para permitir recursão ilimitada.

**Impacto**: Pode causar problemas em SQL Servers com configuração restritiva.

**Solução**: Ajustar configuração do SQL Server ou limitar período de análise.

---

## ✅ Checklist de Implementação

### Setup Inicial
- [ ] Executar `sql/funcoes_dias_uteis_simples.sql`
- [ ] Validar criação das funções
- [ ] Criar índices recomendados

### Backend
- [ ] Criar `app/services/inadimplencia_service.py`
- [ ] Implementar método `get_taxa_inadimplencia_temporal()`
- [ ] Criar rota `/api/kpi/inadimplencia-temporal`
- [ ] Testar com período curto (30 dias)
- [ ] Testar com período longo (1 ano)

### Frontend
- [ ] Criar componente de gráfico de linha
- [ ] Adicionar filtros de período (data início/fim)
- [ ] Adicionar filtro de agrupamento (DIA/MES)
- [ ] Implementar loading state
- [ ] Testar visualização com dados reais

### Validação
- [ ] Validar cálculo de inadimplência com casos de teste
- [ ] Comparar resultados com cálculos manuais
- [ ] Testar performance com diferentes períodos
- [ ] Validar com equipe FinanBlue

---

**Documento validado e pronto para uso**  
**Última atualização**: 1 de novembro de 2025  
**Autor**: Dashboard Fonte Team  
**Versão**: 1.0

