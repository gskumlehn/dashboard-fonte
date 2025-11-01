# 📝 Changelog - Versão 4.0

**Data**: 1 de novembro de 2025  
**Versão**: 4.0 (Sem Views + Inadimplência Histórica)

---

## 🎯 Objetivo da Versão 4.0

Remover dependência de views do banco de dados e implementar lógica completa de inadimplência considerando:
- Dias úteis bancários (excluindo fins de semana)
- Feriados bancários (nacionais, estaduais, municipais)
- Taxa de inadimplência histórica diária (não apenas snapshot atual)

---

## ❌ O Que Foi Removido

### Views Removidas

1. **`ViewDocumentoAtrasoCalculo`**
   - **Motivo**: Dependência externa que pode não existir ou estar desatualizada
   - **Substituído por**: Lógica direta com funções SQL customizadas

2. **Outras views não especificadas**
   - **Motivo**: Preferência por queries diretas nas tabelas base
   - **Substituído por**: Queries SQL com JOINs diretos

---

## ✅ O Que Foi Adicionado

### 1. Tabela `FeriadosBancarios`

**Arquivo**: `sql/create_feriados_bancarios.sql`

**Estrutura**:
```sql
CREATE TABLE [dbo].[FeriadosBancarios] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Data] DATE NOT NULL,
    [Descricao] NVARCHAR(200) NOT NULL,
    [Tipo] NVARCHAR(50) NOT NULL,  -- 'Nacional', 'Estadual', 'Municipal'
    [Estado] NVARCHAR(2) NULL,
    [Cidade] NVARCHAR(100) NULL,
    [IsDeleted] BIT NOT NULL DEFAULT 0,
    [CreationTime] DATETIME NOT NULL DEFAULT GETDATE()
);
```

**Feriados Cadastrados**:
- 2024: 13 feriados nacionais
- 2025: 13 feriados nacionais
- 2026: 13 feriados nacionais
- Exemplos de feriados estaduais (SP)
- Exemplos de feriados municipais (São Paulo)

**Total**: 39+ feriados cadastrados

---

### 2. Funções SQL para Dias Úteis

#### Função `fn_IsDiaUtilBancario()`

**Propósito**: Verificar se uma data é dia útil bancário.

**Parâmetros**:
- `@Data` - Data a verificar
- `@Estado` - Sigla do estado (opcional)
- `@Cidade` - Nome da cidade (opcional)

**Retorno**: `BIT` (1 = dia útil, 0 = não é dia útil)

**Lógica**:
1. Verifica se é sábado ou domingo → retorna 0
2. Verifica se é feriado nacional → retorna 0
3. Verifica se é feriado estadual (se estado informado) → retorna 0
4. Verifica se é feriado municipal (se cidade informada) → retorna 0
5. Caso contrário → retorna 1

**Exemplo de uso**:
```sql
-- Verificar se 01/11/2025 (sábado) é dia útil
SELECT dbo.fn_IsDiaUtilBancario('2025-11-01', NULL, NULL);  -- Retorna 0
```

---

#### Função `fn_ProximoDiaUtilBancario()`

**Propósito**: Encontrar o próximo dia útil bancário a partir de uma data.

**Parâmetros**:
- `@Data` - Data inicial
- `@Estado` - Sigla do estado (opcional)
- `@Cidade` - Nome da cidade (opcional)

**Retorno**: `DATE` (próximo dia útil)

**Lógica**:
1. Se a data já é dia útil, retorna ela mesma
2. Senão, incrementa 1 dia e verifica novamente
3. Repete até encontrar um dia útil (máximo 30 iterações)

**Exemplo de uso**:
```sql
-- Próximo dia útil após 01/11/2025 (sábado)
SELECT dbo.fn_ProximoDiaUtilBancario('2025-11-01', NULL, NULL);  -- Retorna 03/11/2025 (segunda)
```

---

#### Função `fn_DataVencimentoAjustada()`

**Propósito**: Ajustar data de vencimento para o próximo dia útil se cair em fim de semana/feriado.

**Parâmetros**:
- `@DataVencimento` - Data de vencimento original
- `@Estado` - Sigla do estado (opcional)
- `@Cidade` - Nome da cidade (opcional)

**Retorno**: `DATE` (vencimento ajustado)

**Lógica**:
- Se o vencimento é dia útil → retorna a data original
- Se o vencimento não é dia útil → retorna o próximo dia útil

**Exemplo de uso**:
```sql
-- Ajustar vencimento de 01/11/2025 (sábado)
SELECT dbo.fn_DataVencimentoAjustada('2025-11-01', NULL, NULL);  -- Retorna 03/11/2025 (segunda)
```

---

### 3. Query de Inadimplência Histórica Diária

**Arquivo**: `sql/query_inadimplencia_historica.sql`

**Propósito**: Calcular a taxa de inadimplência para cada dia de um período, permitindo visualização da evolução temporal.

**Conceito de Inadimplência**:

Um documento está **inadimplente** em uma data específica se:
1. A data de análise é **maior** que o vencimento ajustado
2. A data de análise é **menor** que a data de baixa (ou hoje, se não foi baixado)

**Exemplo**:
- Vencimento original: 01/out/2025 (sexta-feira)
- Vencimento ajustado: 01/out/2025 (já é dia útil)
- Data de baixa: 10/out/2025
- **Inadimplente de**: 02/out a 09/out (8 dias)
- **NÃO inadimplente em**: 01/out (dia do vencimento) e 10/out (dia da baixa)

**Estrutura da Query**:

```sql
-- CTE 1: DateSeries
-- Gera série de datas (todos os dias do período)

-- CTE 2: DocumentosAjustados
-- Calcula vencimento ajustado e período de inadimplência

-- CTE 3: DocumentosVencidosPorDia
-- Verifica se cada documento estava vencido em cada dia

-- CTE 4: DocumentosAtivosPorDia
-- Conta documentos ativos (denominador)

-- Query Final
-- Calcula taxa de inadimplência por dia
```

**Retorno**:
```
analysis_date          | overdue_documents | total_documents | default_rate_percent
-----------------------|-------------------|-----------------|---------------------
2024-11-01             | 15                | 250             | 6.00
2024-11-02             | 18                | 252             | 7.14
2024-11-03             | 12                | 248             | 4.84
...
```

**Uso no Chart.js**:
```javascript
{
  type: 'line',
  data: {
    labels: ['01/11', '02/11', '03/11', ...],
    datasets: [{
      label: 'Taxa de Inadimplência (%)',
      data: [6.00, 7.14, 4.84, ...],
      borderColor: '#dc3545',
      backgroundColor: 'rgba(220, 53, 69, 0.1)'
    }]
  }
}
```

---

## 🔄 Queries Atualizadas

### KPI 1.2: Taxa de Inadimplência

**Antes (V3)**:
```sql
SELECT 
    COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) as overdue_count,
    COUNT(*) as total_count
FROM ViewDocumentoAtrasoCalculo v  -- ❌ Dependia de view
WHERE v.IsDeleted = 0;
```

**Depois (V4)**:
```sql
SELECT 
    COUNT(DISTINCT CASE WHEN is_overdue = 1 THEN d.Id END) as overdue_documents,
    COUNT(DISTINCT d.Id) as total_documents
FROM (
    SELECT 
        d.Id,
        CASE 
            WHEN d.Status = 0
             AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
            THEN 1
            ELSE 0
        END as is_overdue
    FROM Documento d  -- ✅ Query direta na tabela
    WHERE d.IsDeleted = 0
      AND d.DataVencimento IS NOT NULL
) d;
```

**Mudanças**:
- ❌ Removida dependência de `ViewDocumentoAtrasoCalculo`
- ✅ Usa função `fn_DataVencimentoAjustada()` para vencimento ajustado
- ✅ Lógica direta: `data_hoje > vencimento_ajustado`

---

### KPI 2.2: Taxa de Inadimplência por Cliente

**Antes (V3)**:
```sql
LEFT JOIN ViewDocumentoAtrasoCalculo v ON d.Id = v.DocumentoId  -- ❌ View
WHERE v.Atraso > 0
```

**Depois (V4)**:
```sql
COUNT(CASE 
    WHEN d.Status = 0
     AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
    THEN 1 
END) as overdue_documents  -- ✅ Lógica direta
```

---

### KPI 2.4: Score de Risco por Cliente

**Antes (V3)**:
```sql
AVG(CASE WHEN v.Atraso > 0 THEN v.Atraso ELSE 0 END) as avg_delay_days  -- ❌ View
```

**Depois (V4)**:
```sql
AVG(CASE 
    WHEN d.Status = 0
     AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
    THEN DATEDIFF(DAY, dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade), GETDATE())
    ELSE 0
END) as avg_delay_days  -- ✅ Cálculo direto
```

---

### KPI 4.1: Aging de Documentos

**Antes (V3)**:
```sql
FROM ViewDocumentoAtrasoCalculo v  -- ❌ View
WHERE v.Atraso > 0
```

**Depois (V4)**:
```sql
WITH DocumentosVencidos AS (
    SELECT 
        d.Id,
        DATEDIFF(DAY, 
            dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade), 
            GETDATE()
        ) as days_overdue  -- ✅ Cálculo direto
    FROM Documento d
    WHERE d.Status = 0
      AND CAST(GETDATE() AS DATE) > dbo.fn_DataVencimentoAjustada(d.DataVencimento, :estado, :cidade)
)
```

---

## 📊 Novos KPIs Adicionados

### KPI 1.2B: Taxa de Inadimplência Histórica

**Descrição**: Gráfico de linha mostrando a evolução da taxa de inadimplência ao longo do tempo.

**Período**: Último ano (ou período customizável)

**Granularidade**: Diária (pode ser agregada em semanal/mensal)

**Tipo de Gráfico**: Line Chart

**Exemplo de visualização**:
```
Taxa (%)
  10% |                    *
   8% |         *     *   * *
   6% |    *   * *   *   *   *
   4% |   * * *   * *         *
   2% | *                       *
   0% +---------------------------
      Jan  Fev  Mar  Abr  Mai  Jun
```

---

### KPI 1.2C: Taxa de Inadimplência Agregada

**Descrição**: Taxa média de inadimplência por mês ou semana.

**Agregações disponíveis**:
- **Semanal**: Média da taxa diária por semana
- **Mensal**: Média da taxa diária por mês

**Tipo de Gráfico**: Bar Chart

---

## 🔧 Impacto na Implementação

### Backend (Python)

**Novo serviço**:
```python
# app/services/inadimplencia_service.py
class InadimplenciaService:
    def get_taxa_inadimplencia_atual(self, estado=None, cidade=None):
        # Taxa atual (snapshot de hoje)
        pass
    
    def get_taxa_inadimplencia_historica(self, start_date, end_date, estado=None, cidade=None):
        # Taxa histórica dia a dia
        pass
```

**Novos parâmetros em todas as queries de inadimplência**:
- `estado` - Sigla do estado (ex: 'SP') ou NULL
- `cidade` - Nome da cidade (ex: 'São Paulo') ou NULL

---

### Frontend (JavaScript)

**Novo gráfico**:
```javascript
// Gráfico de linha para inadimplência histórica
const inadimplenciaChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: dates,  // Array de datas
        datasets: [{
            label: 'Taxa de Inadimplência (%)',
            data: rates,  // Array de taxas
            borderColor: '#dc3545',
            fill: true
        }]
    }
});
```

---

## ⚠️ Breaking Changes

### 1. Setup Obrigatório

**ANTES de usar as queries**, é **OBRIGATÓRIO** executar:

```sql
-- Executar uma única vez no banco de dados
-- Arquivo: sql/create_feriados_bancarios.sql
```

Isso criará:
- Tabela `FeriadosBancarios`
- Funções `fn_IsDiaUtilBancario()`, `fn_ProximoDiaUtilBancario()`, `fn_DataVencimentoAjustada()`
- Feriados de 2024-2026

---

### 2. Parâmetros Adicionais

Todas as queries de inadimplência agora aceitam parâmetros opcionais:
- `:estado` - Para considerar feriados estaduais
- `:cidade` - Para considerar feriados municipais

**Exemplo**:
```python
# Antes (V3)
result = kpi_service.get_taxa_inadimplencia()

# Depois (V4)
result = kpi_service.get_taxa_inadimplencia(estado='SP', cidade='São Paulo')
# ou
result = kpi_service.get_taxa_inadimplencia()  # NULL para ambos
```

---

### 3. Performance

**Atenção**: A query de inadimplência histórica pode ser **pesada** para períodos longos.

**Recomendações**:
- Para análise de 1 ano (365 dias): OK
- Para análise de > 1 ano: Considerar agregação mensal
- Adicionar índices nas tabelas:
  ```sql
  CREATE INDEX IX_Documento_DataVencimento ON Documento(DataVencimento) WHERE IsDeleted = 0;
  CREATE INDEX IX_Documento_DataBaixa ON Documento(DataBaixa) WHERE IsDeleted = 0;
  CREATE INDEX IX_Documento_Status ON Documento(Status) WHERE IsDeleted = 0;
  ```

---

## 📚 Arquivos Modificados/Criados

### Novos Arquivos

1. **`sql/create_feriados_bancarios.sql`** (10 KB)
   - Tabela FeriadosBancarios
   - 3 funções SQL
   - 39+ feriados cadastrados

2. **`sql/query_inadimplencia_historica.sql`** (8 KB)
   - Query completa de inadimplência histórica
   - Exemplos de uso
   - Testes

3. **`docs/DASHBOARD_SPECIFICATION_V4.md`** (35 KB)
   - Especificação atualizada
   - Todas as queries sem views
   - Novos KPIs

4. **`CHANGELOG_V4.md`** (este arquivo)
   - Documentação completa das mudanças

### Arquivos Mantidos (sem mudanças)

- `docs/ENUMS_CONFIRMADOS.md`
- `app/constants/enums.py`
- `docs/DASHBOARD_SPECIFICATION_FINAL.md` (V3 - mantido para referência)

---

## ✅ Checklist de Migração V3 → V4

### Passo 1: Setup do Banco de Dados
- [ ] Executar `sql/create_feriados_bancarios.sql` no SQL Server
- [ ] Verificar se a tabela `FeriadosBancarios` foi criada
- [ ] Verificar se as 3 funções foram criadas
- [ ] Testar função `fn_IsDiaUtilBancario('2025-11-01', NULL, NULL)` → deve retornar 0
- [ ] Testar função `fn_ProximoDiaUtilBancario('2025-11-01', NULL, NULL)` → deve retornar '2025-11-03'

### Passo 2: Atualizar Backend
- [ ] Criar `app/services/inadimplencia_service.py`
- [ ] Atualizar queries de inadimplência para usar funções SQL
- [ ] Adicionar parâmetros `estado` e `cidade` nos métodos
- [ ] Testar query de inadimplência atual
- [ ] Testar query de inadimplência histórica (período curto: 30 dias)

### Passo 3: Atualizar Frontend
- [ ] Criar componente de gráfico de inadimplência histórica
- [ ] Adicionar filtros de período (data início/fim)
- [ ] Adicionar opção de agregação (diária/semanal/mensal)
- [ ] Testar visualização com dados reais

### Passo 4: Otimização
- [ ] Criar índices recomendados nas tabelas
- [ ] Testar performance com período de 1 ano
- [ ] Ajustar agregação se necessário

### Passo 5: Validação
- [ ] Comparar resultados V3 vs V4 (devem ser similares)
- [ ] Validar cálculo de dias úteis com casos de teste
- [ ] Validar período de inadimplência com exemplos reais
- [ ] Testar com diferentes estados/cidades

---

## 🎯 Próximos Passos

1. **Executar setup** (`sql/create_feriados_bancarios.sql`)
2. **Testar queries** no SSMS com dados reais
3. **Implementar backend** com novos serviços
4. **Implementar frontend** com gráfico histórico
5. **Validar resultados** com equipe FinanBlue

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Revisar este changelog
2. Consultar `docs/DASHBOARD_SPECIFICATION_V4.md`
3. Verificar queries em `sql/`
4. Testar funções SQL isoladamente

---

**Última atualização**: 1 de novembro de 2025  
**Autor**: Dashboard Fonte Team  
**Versão**: 4.0

