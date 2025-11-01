# Enums Confirmados - Reunião FinanBlue

**Data da Reunião**: 1 de novembro de 2025  
**Data do Documento**: 1 de novembro de 2025  
**Status**: ✅ Validado pela FinanBlue

---

## 📋 Resumo Executivo

Este documento consolida todos os valores de enums confirmados pela equipe da FinanBlue durante a reunião de alinhamento. As informações aqui contidas são **oficiais e validadas**, devendo ser utilizadas como referência para o desenvolvimento do dashboard.

**Total de enums confirmados**: 9 campos críticos  
**Fonte**: Reunião com equipe FinanBlue + Análise de views do banco de dados

---

## 🎯 Enums Críticos Confirmados

### 1. Operacao.Status

**Tipo**: `tinyint`  
**Descrição**: Status da operação de factoring  
**Fonte**: Reunião FinanBlue

| Valor | Descrição | Significado |
|-------|-----------|-------------|
| `0` | Aberto | Operação em andamento, ainda não finalizada |
| `1` | Fechado | Operação concluída/finalizada |

**Uso no Dashboard**:
- Filtrar operações ativas: `WHERE Status = 0`
- Filtrar operações concluídas: `WHERE Status = 1`
- KPIs de volume devem considerar ambos os status

**Exemplo SQL**:
```sql
-- Volume de operações fechadas
SELECT 
    COUNT(*) as Total_Operacoes,
    SUM(ValorOperacao) as Valor_Total
FROM Operacao
WHERE Status = 1
  AND IsDeleted = 0;
```

---

### 2. Documento.Status

**Tipo**: `tinyint`  
**Descrição**: Status do documento/título  
**Fonte**: Reunião FinanBlue

| Valor | Descrição | Significado |
|-------|-----------|-------------|
| `0` | Aberto | Documento em aberto, aguardando pagamento |
| `1` | Baixado | Documento baixado/quitado |

**Uso no Dashboard**:
- Documentos em aberto: `WHERE Status = 0`
- Documentos baixados: `WHERE Status = 1`
- **Taxa de Inadimplência**: Usar em conjunto com `ViewDocumentoAtrasoCalculo`

**Observação Importante**: Para identificar documentos vencidos, utilizar a view `ViewDocumentoAtrasoCalculo[Atraso]` ao invés de confiar apenas no status.

**Exemplo SQL**:
```sql
-- Documentos em aberto
SELECT COUNT(*) 
FROM Documento
WHERE Status = 0
  AND IsDeleted = 0;

-- Documentos vencidos (usar view específica)
SELECT COUNT(*)
FROM ViewDocumentoAtrasoCalculo
WHERE Atraso > 0
  AND IsDeleted = 0;
```

---

### 3. Documento.StatusLiberacao

**Tipo**: `tinyint`  
**Descrição**: Status de liberação de crédito do documento  
**Fonte**: Reunião FinanBlue

| Valor | Descrição | Significado |
|-------|-----------|-------------|
| `0` | Pendente | Aguardando análise/aprovação de crédito |
| `1` | Liberado | Crédito aprovado e liberado |
| `2` | Rejeitado | Crédito rejeitado/negado |

**Uso no Dashboard**:
- Documentos liberados: `WHERE StatusLiberacao = 1`
- Taxa de aprovação: `COUNT(StatusLiberacao = 1) / COUNT(*)`
- Análise de risco: Segmentar por status de liberação

**Exemplo SQL**:
```sql
-- Taxa de aprovação de crédito
SELECT 
    StatusLiberacao,
    COUNT(*) as Quantidade,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as Percentual
FROM Documento
WHERE IsDeleted = 0
GROUP BY StatusLiberacao;
```

---

### 4. Documento.Tipo

**Tipo**: `tinyint`  
**Descrição**: Tipo de documento quanto à origem  
**Fonte**: Reunião FinanBlue

| Valor | Descrição | Significado |
|-------|-----------|-------------|
| `0` | Baixado/Sacado | Documento do sacado (devedor) |
| `1` | Recomprado/Cliente | Documento recomprado pelo cliente (cedente) |

**Uso no Dashboard**:
- Documentos de sacado: `WHERE Tipo = 0`
- Documentos recomprados: `WHERE Tipo = 1`
- **Taxa de Recompra**: Calcular proporção de `Tipo = 1`

**Exemplo SQL**:
```sql
-- Taxa de recompra
SELECT 
    COUNT(CASE WHEN Tipo = 1 THEN 1 END) * 100.0 / COUNT(*) as Taxa_Recompra
FROM Documento
WHERE IsDeleted = 0;
```

---

### 5. Documento.TipoBaixa

**Tipo**: `tinyint`  
**Descrição**: Tipo de baixa do documento  
**Fonte**: Reunião FinanBlue (valores atualizados)

| Valor | Descrição | Significado |
|-------|-----------|-------------|
| `0` | Baixa | Baixa normal do documento |
| `1` | Liquidação | Liquidação/pagamento do documento |
| `2` | Devolução | Devolução do documento |
| `3` | Transferência | Transferência para outra carteira |
| `4` | Perda | Perda/prejuízo (inadimplência confirmada) |
| `5` | Confissão de Dívida | Documento convertido em confissão de dívida |
| `6` | Baixa por Depósito | Baixa através de depósito judicial |
| `7` | Baixado Protestado | Baixa de documento protestado |

**Uso no Dashboard**:
- Liquidações: `WHERE TipoBaixa = 1`
- Perdas: `WHERE TipoBaixa = 4`
- **Taxa de Perda**: `COUNT(TipoBaixa = 4) / COUNT(*)`

**Observação**: Valores 2, 5 e 7 foram adicionados pela FinanBlue (não apareceram na análise inicial).

**Exemplo SQL**:
```sql
-- Distribuição de tipos de baixa
SELECT 
    TipoBaixa,
    CASE TipoBaixa
        WHEN 0 THEN 'Baixa'
        WHEN 1 THEN 'Liquidação'
        WHEN 2 THEN 'Devolução'
        WHEN 3 THEN 'Transferência'
        WHEN 4 THEN 'Perda'
        WHEN 5 THEN 'Confissão de Dívida'
        WHEN 6 THEN 'Baixa por Depósito'
        WHEN 7 THEN 'Baixado Protestado'
    END as Descricao,
    COUNT(*) as Quantidade
FROM Documento
WHERE Status = 1  -- Baixado
  AND IsDeleted = 0
GROUP BY TipoBaixa
ORDER BY TipoBaixa;
```

---

### 6. Documento.eParcial

**Tipo**: `bit` (boolean)  
**Descrição**: Indica se o documento foi baixado parcialmente  
**Fonte**: Reunião FinanBlue

| Valor | Descrição | Significado |
|-------|-----------|-------------|
| `0` | Não Parcial | Baixa total do documento |
| `1` | Parcial | Baixa parcial do documento |

**Uso no Dashboard**:
- Baixas totais: `WHERE eParcial = 0`
- Baixas parciais: `WHERE eParcial = 1`
- Análise de recebimentos: Segmentar por tipo de baixa

**Exemplo SQL**:
```sql
-- Documentos com baixa parcial
SELECT COUNT(*)
FROM Documento
WHERE Status = 1  -- Baixado
  AND eParcial = 1
  AND IsDeleted = 0;
```

---

### 7. IsDeleted (Campo Comum)

**Tipo**: `bit` (boolean)  
**Descrição**: Indica se o registro foi excluído logicamente (soft delete)  
**Fonte**: Reunião FinanBlue  
**Aplicação**: Presente em **quase todas as tabelas** do sistema

| Valor | Descrição | Significado |
|-------|-----------|-------------|
| `0` | Ativo | Registro ativo e válido |
| `1` | Excluído | Registro excluído logicamente |

**Uso no Dashboard**:
- **SEMPRE** filtrar por `IsDeleted = 0` em todas as queries
- Ignorar registros com `IsDeleted = 1`

**Exemplo SQL**:
```sql
-- Template padrão para queries
SELECT *
FROM [Tabela]
WHERE IsDeleted = 0  -- SEMPRE incluir este filtro
  AND [outras condições];
```

---

### 8. TipoRecompra (Confirmado)

**Tipo**: `tinyint`  
**Descrição**: Tipo de recompra do documento  
**Fonte**: Análise de views (confirmado pela FinanBlue)

| Valor | Descrição | Significado |
|-------|-----------|-------------|
| `0` | Normal | Recompra normal pelo cliente |
| `1` | Cobrança | Recompra por cobrança |

**Uso no Dashboard**:
- Recompras normais: `WHERE TipoRecompra = 0`
- Recompras por cobrança: `WHERE TipoRecompra = 1`

**Exemplo SQL**:
```sql
-- Análise de recompras
SELECT 
    TipoRecompra,
    COUNT(*) as Quantidade
FROM Documento
WHERE Tipo = 1  -- Recomprado
  AND IsDeleted = 0
GROUP BY TipoRecompra;
```

---

### 9. ControladoriaDocumentoStatus (Confirmado)

**Tipo**: `tinyint`  
**Descrição**: Status do documento na controladoria  
**Fonte**: Análise de views (confirmado pela FinanBlue)

| Valor | Descrição | Significado |
|-------|-----------|-------------|
| `0` | Aberta | Documento em aberto na controladoria |
| `1` | Baixada | Documento baixado na controladoria |

**Uso no Dashboard**:
- Documentos em aberto: `WHERE ControladoriaDocumentoStatus = 0`
- Documentos baixados: `WHERE ControladoriaDocumentoStatus = 1`

---

## 🔍 Informações Adicionais Importantes

### Relacionamentos Confirmados

**Documento → Operação → Cliente**

A estrutura de relacionamento é:
1. **Documento** não tem cliente vinculado diretamente
2. **Documento** é vinculado a **Operação**
3. **Operação** é vinculada ao **Cliente**

**Implicação para queries**:
```sql
-- Para obter cliente de um documento, usar JOIN
SELECT 
    d.*,
    o.ClienteId,
    c.Nome as ClienteNome
FROM Documento d
INNER JOIN Operacao o ON d.OperacaoId = o.Id
INNER JOIN Cliente c ON o.ClienteId = c.Id
WHERE d.IsDeleted = 0
  AND o.IsDeleted = 0
  AND c.IsDeleted = 0;
```

---

### View Específica para Atraso

**ViewDocumentoAtrasoCalculo**

Para verificar documentos vencidos, utilizar a view `ViewDocumentoAtrasoCalculo` com o campo `[Atraso]`:

- `Atraso > 0`: Documento vencido
- `Atraso = 0`: Documento em dia
- `Atraso < 0`: Documento com vencimento futuro

**Exemplo SQL**:
```sql
-- Taxa de inadimplência
SELECT 
    COUNT(CASE WHEN Atraso > 0 THEN 1 END) * 100.0 / COUNT(*) as Taxa_Inadimplencia
FROM ViewDocumentoAtrasoCalculo
WHERE IsDeleted = 0;
```

---

### Informações de Estorno

**DocumentoBaixaRecompra**

Informações sobre estornos ficam armazenadas na tabela `DocumentoBaixaRecompra`.

**Uso no Dashboard**:
- Analisar estornos: Consultar tabela `DocumentoBaixaRecompra`
- Filtrar documentos estornados

---

## 📊 Comparação: Descoberto vs Confirmado

### Enums que Foram Confirmados

| Enum | Status Anterior | Status Atual |
|------|----------------|--------------|
| **TipoBaixa** | ✅ Descoberto (5 valores) | ✅ Confirmado e expandido (8 valores) |
| **TipoRecompra** | ✅ Descoberto | ✅ Confirmado |
| **ControladoriaDocumentoStatus** | ✅ Descoberto | ✅ Confirmado |

### Enums que Foram Adicionados

| Enum | Status Anterior | Status Atual |
|------|----------------|--------------|
| **Operacao.Status** | ❌ Não descoberto | ✅ Confirmado pela FinanBlue |
| **Documento.Status** | ⚠️ Descoberto com dúvidas | ✅ Confirmado pela FinanBlue |
| **Documento.StatusLiberacao** | ❌ Não descoberto | ✅ Confirmado pela FinanBlue |
| **Documento.Tipo** | ❌ Não descoberto | ✅ Confirmado pela FinanBlue |
| **Documento.eParcial** | ❌ Não descoberto | ✅ Confirmado pela FinanBlue |
| **IsDeleted** | ⚠️ Conhecido | ✅ Confirmado como padrão |

### Valores Adicionados ao TipoBaixa

Valores que não apareceram na análise inicial:
- `2` = Devolução
- `5` = Confissão de Dívida
- `7` = Baixado Protestado

**Motivo**: Provavelmente não há registros com estes valores no banco de dados atual, mas são valores válidos no sistema.

---

## 🚀 Impacto nos KPIs

### KPIs Agora Desbloqueados

Com os enums confirmados, **TODOS os KPIs críticos** estão desbloqueados:

#### 1. Volume de Operações
✅ **Desbloqueado** com `Operacao.Status`

```sql
SELECT 
    COUNT(*) as Total_Operacoes,
    SUM(ValorOperacao) as Valor_Total
FROM Operacao
WHERE Status = 1  -- Fechado
  AND IsDeleted = 0;
```

#### 2. Taxa de Inadimplência
✅ **Desbloqueado** com `ViewDocumentoAtrasoCalculo[Atraso]`

```sql
SELECT 
    COUNT(CASE WHEN Atraso > 0 THEN 1 END) * 100.0 / COUNT(*) as Taxa_Inadimplencia
FROM ViewDocumentoAtrasoCalculo
WHERE IsDeleted = 0;
```

#### 3. Taxa de Recompra
✅ **Desbloqueado** com `Documento.Tipo`

```sql
SELECT 
    COUNT(CASE WHEN Tipo = 1 THEN 1 END) * 100.0 / COUNT(*) as Taxa_Recompra
FROM Documento
WHERE IsDeleted = 0;
```

#### 4. ROI (Return on Investment)
✅ **Desbloqueado** com `Operacao.Status`

```sql
SELECT 
    (SUM(ValorRecebido) - SUM(ValorOperacao)) * 100.0 / SUM(ValorOperacao) as ROI
FROM Operacao
WHERE Status = 1  -- Fechado
  AND IsDeleted = 0;
```

#### 5. Taxa de Aprovação de Crédito
✅ **Desbloqueado** com `Documento.StatusLiberacao`

```sql
SELECT 
    COUNT(CASE WHEN StatusLiberacao = 1 THEN 1 END) * 100.0 / COUNT(*) as Taxa_Aprovacao
FROM Documento
WHERE IsDeleted = 0;
```

#### 6. Taxa de Perda
✅ **Desbloqueado** com `Documento.TipoBaixa`

```sql
SELECT 
    COUNT(CASE WHEN TipoBaixa = 4 THEN 1 END) * 100.0 / COUNT(*) as Taxa_Perda
FROM Documento
WHERE Status = 1  -- Baixado
  AND IsDeleted = 0;
```

---

## 📝 Regras de Negócio Confirmadas

### 1. Soft Delete Universal

**Regra**: Todas as queries devem filtrar por `IsDeleted = 0`

**Aplicação**: Em **todas** as tabelas do sistema

**Exemplo**:
```sql
-- ❌ ERRADO - Não filtra IsDeleted
SELECT COUNT(*) FROM Operacao WHERE Status = 1;

-- ✅ CORRETO - Filtra IsDeleted
SELECT COUNT(*) FROM Operacao WHERE Status = 1 AND IsDeleted = 0;
```

### 2. Documentos Vencidos

**Regra**: Usar `ViewDocumentoAtrasoCalculo[Atraso]` ao invés de comparar datas manualmente

**Motivo**: A view já considera regras de negócio (feriados, dias úteis, prorrogações, etc.)

**Exemplo**:
```sql
-- ✅ CORRETO - Usar view específica
SELECT COUNT(*)
FROM ViewDocumentoAtrasoCalculo
WHERE Atraso > 0
  AND IsDeleted = 0;

-- ❌ EVITAR - Comparação manual pode não considerar todas as regras
SELECT COUNT(*)
FROM Documento
WHERE DataVencimento < GETDATE()
  AND Status = 0
  AND IsDeleted = 0;
```

### 3. Relacionamento Documento-Cliente

**Regra**: Documento não tem cliente direto, deve passar por Operação

**Estrutura**: `Documento → Operacao → Cliente`

**Exemplo**:
```sql
-- ✅ CORRETO - JOIN através de Operacao
SELECT 
    c.Nome,
    COUNT(d.Id) as Total_Documentos
FROM Cliente c
INNER JOIN Operacao o ON c.Id = o.ClienteId
INNER JOIN Documento d ON o.Id = d.OperacaoId
WHERE c.IsDeleted = 0
  AND o.IsDeleted = 0
  AND d.IsDeleted = 0
GROUP BY c.Nome;
```

### 4. Estornos

**Regra**: Informações de estorno ficam em tabela separada

**Tabela**: `DocumentoBaixaRecompra`

**Aplicação**: Para análise de estornos, consultar esta tabela

---

## 🎯 Próximos Passos

### 1. Atualizar Constantes Python ✅

Criar arquivo `app/constants/enums.py` com todos os valores confirmados.

### 2. Atualizar Queries dos KPIs ✅

Revisar e atualizar todas as queries em:
- `docs/KPI_Calculation_Specification.md`
- `docs/DASHBOARD_SPECIFICATION_V2.md`

### 3. Implementar KPIs no Backend ✅

Implementar as queries validadas no backend Flask.

### 4. Testar com Dados Reais ✅

Executar queries no SSMS para validar resultados.

### 5. Documentar Casos de Uso ✅

Criar exemplos de queries para cada KPI do dashboard.

---

## 📚 Referências

### Documentos Relacionados

- **Análise Inicial**: `docs/ENUMS_ANALISADOS.md`
- **Especificação de KPIs**: `docs/KPI_Calculation_Specification.md`
- **Especificação do Dashboard**: `docs/DASHBOARD_SPECIFICATION_V2.md`
- **Perguntas da Reunião**: `docs/PERGUNTAS_REUNIAO_FINANBLUE.md`

### Fonte das Informações

- **Reunião FinanBlue**: 1 de novembro de 2025
- **Análise de Views**: Scripts `analyze_view_columns.py` e `extract_enum_meanings.py`
- **Validação**: Equipe técnica da FinanBlue

---

## ✅ Status de Validação

| Enum | Validado | Fonte | Observações |
|------|----------|-------|-------------|
| Operacao.Status | ✅ | FinanBlue | 0=Aberto, 1=Fechado |
| Documento.Status | ✅ | FinanBlue | 0=Aberto, 1=Baixado |
| Documento.StatusLiberacao | ✅ | FinanBlue | 0=Pendente, 1=Liberado, 2=Rejeitado |
| Documento.Tipo | ✅ | FinanBlue | 0=Sacado, 1=Recomprado |
| Documento.TipoBaixa | ✅ | FinanBlue | 8 valores (0-7) |
| Documento.eParcial | ✅ | FinanBlue | 0=Total, 1=Parcial |
| TipoRecompra | ✅ | FinanBlue | 0=Normal, 1=Cobrança |
| ControladoriaDocumentoStatus | ✅ | FinanBlue | 0=Aberta, 1=Baixada |
| IsDeleted | ✅ | FinanBlue | Padrão em todas as tabelas |

---

**Documento validado e aprovado pela FinanBlue**  
**Última atualização**: 1 de novembro de 2025  
**Autor**: Dashboard Fonte Team  
**Versão**: 1.0 (Oficial)

