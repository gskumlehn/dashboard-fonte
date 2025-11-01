# Especificação de Cálculo de KPIs - Dashboard Fonte

**Data**: 1 de novembro de 2025  
**Versão**: 2.0 (Atualizada com enums confirmados)  
**Status**: ✅ Validado pela FinanBlue

---

## 📋 Resumo Executivo

Este documento especifica o cálculo de todos os KPIs (Key Performance Indicators) do dashboard da Fonte Inc. Todas as queries foram **atualizadas com os valores de enum confirmados** pela equipe da FinanBlue em reunião realizada em 1 de novembro de 2025.

**Total de KPIs especificados**: 12  
**Fonte dos enums**: Reunião FinanBlue + Análise de views  
**Referência**: `docs/ENUMS_CONFIRMADOS.md`

---

## 🎯 KPIs Críticos

### 1. Volume de Operações

**Descrição**: Volume total de operações de factoring em um período.

**Fórmula**:
```
Volume = COUNT(Operacao) WHERE Status = FECHADO AND IsDeleted = 0
Valor Total = SUM(Operacao.ValorOperacao) WHERE Status = FECHADO AND IsDeleted = 0
```

**Query SQL**:
```sql
-- Volume de operações fechadas no período
SELECT 
    COUNT(*) as Total_Operacoes,
    SUM(ValorOperacao) as Valor_Total,
    AVG(ValorOperacao) as Ticket_Medio
FROM Operacao
WHERE Status = 1  -- Fechado (OperacaoStatus.FECHADO)
  AND IsDeleted = 0  -- Ativo (IsDeleted.ATIVO)
  AND DataOperacao BETWEEN @DataInicio AND @DataFim;
```

**Tabelas utilizadas**:
- `Operacao`

**Campos enum utilizados**:
- `Operacao.Status` = 1 (Fechado)
- `Operacao.IsDeleted` = 0 (Ativo)

**Segmentação**:
- Por período (dia, semana, mês, ano)
- Por cliente
- Por modalidade
- Por vendedor/agente

---

### 2. Taxa de Inadimplência

**Descrição**: Percentual de documentos vencidos em relação ao total de documentos em aberto.

**Fórmula**:
```
Taxa_Inadimplencia = (COUNT(Documentos Vencidos) / COUNT(Documentos em Aberto)) * 100
```

**Query SQL**:
```sql
-- Taxa de inadimplência usando view específica
SELECT 
    COUNT(CASE WHEN Atraso > 0 THEN 1 END) as Documentos_Vencidos,
    COUNT(*) as Total_Documentos,
    COUNT(CASE WHEN Atraso > 0 THEN 1 END) * 100.0 / COUNT(*) as Taxa_Inadimplencia
FROM ViewDocumentoAtrasoCalculo
WHERE IsDeleted = 0;  -- Ativo (IsDeleted.ATIVO)
```

**Observação Importante**: 
- Usar `ViewDocumentoAtrasoCalculo[Atraso]` ao invés de comparar datas manualmente
- A view já considera regras de negócio (feriados, dias úteis, prorrogações)
- `Atraso > 0`: Documento vencido
- `Atraso = 0`: Documento em dia
- `Atraso < 0`: Documento com vencimento futuro

**Tabelas/Views utilizadas**:
- `ViewDocumentoAtrasoCalculo`

**Campos utilizados**:
- `ViewDocumentoAtrasoCalculo.Atraso`
- `IsDeleted` = 0 (Ativo)

**Segmentação**:
- Por faixa de atraso (0-30 dias, 31-60 dias, 61-90 dias, >90 dias)
- Por cliente
- Por sacado
- Por valor

---

### 3. Taxa de Recompra

**Descrição**: Percentual de documentos recomprados pelo cliente em relação ao total de documentos.

**Fórmula**:
```
Taxa_Recompra = (COUNT(Documentos Recomprados) / COUNT(Total Documentos)) * 100
```

**Query SQL**:
```sql
-- Taxa de recompra
SELECT 
    COUNT(CASE WHEN Tipo = 1 THEN 1 END) as Documentos_Recomprados,
    COUNT(*) as Total_Documentos,
    COUNT(CASE WHEN Tipo = 1 THEN 1 END) * 100.0 / COUNT(*) as Taxa_Recompra
FROM Documento
WHERE IsDeleted = 0;  -- Ativo (IsDeleted.ATIVO)
```

**Tabelas utilizadas**:
- `Documento`

**Campos enum utilizados**:
- `Documento.Tipo` = 1 (Recomprado/Cliente)
- `Documento.IsDeleted` = 0 (Ativo)

**Segmentação**:
- Por tipo de recompra (Normal vs Cobrança)
- Por cliente
- Por período
- Por valor

**Query com segmentação por tipo**:
```sql
-- Taxa de recompra por tipo
SELECT 
    TipoRecompra,
    CASE TipoRecompra
        WHEN 0 THEN 'Normal'
        WHEN 1 THEN 'Cobrança'
    END as Tipo_Descricao,
    COUNT(*) as Quantidade,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as Percentual
FROM Documento
WHERE Tipo = 1  -- Recomprado (DocumentoTipo.RECOMPRADO_CLIENTE)
  AND IsDeleted = 0  -- Ativo (IsDeleted.ATIVO)
GROUP BY TipoRecompra;
```

---

### 4. ROI (Return on Investment)

**Descrição**: Retorno sobre investimento das operações de factoring.

**Fórmula**:
```
ROI = ((Valor Recebido - Valor Investido) / Valor Investido) * 100
```

**Query SQL**:
```sql
-- ROI de operações fechadas
SELECT 
    SUM(ValorOperacao) as Valor_Investido,
    SUM(ValorRecebido) as Valor_Recebido,
    SUM(ValorRecebido) - SUM(ValorOperacao) as Lucro,
    ((SUM(ValorRecebido) - SUM(ValorOperacao)) / SUM(ValorOperacao)) * 100 as ROI_Percentual
FROM Operacao
WHERE Status = 1  -- Fechado (OperacaoStatus.FECHADO)
  AND IsDeleted = 0  -- Ativo (IsDeleted.ATIVO)
  AND DataOperacao BETWEEN @DataInicio AND @DataFim;
```

**Tabelas utilizadas**:
- `Operacao`

**Campos enum utilizados**:
- `Operacao.Status` = 1 (Fechado)
- `Operacao.IsDeleted` = 0 (Ativo)

**Observação**: Considerar apenas operações fechadas para cálculo preciso.

**Segmentação**:
- Por período
- Por cliente
- Por modalidade
- Por vendedor

---

### 5. Taxa de Aprovação de Crédito

**Descrição**: Percentual de documentos com crédito aprovado em relação ao total analisado.

**Fórmula**:
```
Taxa_Aprovacao = (COUNT(Documentos Liberados) / COUNT(Total Documentos Analisados)) * 100
```

**Query SQL**:
```sql
-- Taxa de aprovação de crédito
SELECT 
    COUNT(CASE WHEN StatusLiberacao = 1 THEN 1 END) as Documentos_Liberados,
    COUNT(CASE WHEN StatusLiberacao = 2 THEN 1 END) as Documentos_Rejeitados,
    COUNT(CASE WHEN StatusLiberacao = 0 THEN 1 END) as Documentos_Pendentes,
    COUNT(*) as Total_Documentos,
    COUNT(CASE WHEN StatusLiberacao = 1 THEN 1 END) * 100.0 / 
        NULLIF(COUNT(CASE WHEN StatusLiberacao IN (1, 2) THEN 1 END), 0) as Taxa_Aprovacao
FROM Documento
WHERE IsDeleted = 0;  -- Ativo (IsDeleted.ATIVO)
```

**Tabelas utilizadas**:
- `Documento`

**Campos enum utilizados**:
- `Documento.StatusLiberacao`:
  - 0 = Pendente
  - 1 = Liberado
  - 2 = Rejeitado
- `Documento.IsDeleted` = 0 (Ativo)

**Observação**: Taxa calculada sobre documentos analisados (Liberado + Rejeitado), excluindo Pendentes.

**Segmentação**:
- Por período
- Por cliente
- Por sacado
- Por valor

---

### 6. Taxa de Perda

**Descrição**: Percentual de documentos com perda confirmada em relação ao total de documentos baixados.

**Fórmula**:
```
Taxa_Perda = (COUNT(Documentos com Perda) / COUNT(Documentos Baixados)) * 100
```

**Query SQL**:
```sql
-- Taxa de perda
SELECT 
    COUNT(CASE WHEN TipoBaixa = 4 THEN 1 END) as Documentos_Perda,
    COUNT(*) as Total_Documentos_Baixados,
    COUNT(CASE WHEN TipoBaixa = 4 THEN 1 END) * 100.0 / COUNT(*) as Taxa_Perda
FROM Documento
WHERE Status = 1  -- Baixado (DocumentoStatus.BAIXADO)
  AND IsDeleted = 0;  -- Ativo (IsDeleted.ATIVO)
```

**Tabelas utilizadas**:
- `Documento`

**Campos enum utilizados**:
- `Documento.Status` = 1 (Baixado)
- `Documento.TipoBaixa` = 4 (Perda)
- `Documento.IsDeleted` = 0 (Ativo)

**Segmentação**:
- Por período
- Por cliente
- Por sacado
- Por valor

---

### 7. Volume por Vendedor

**Descrição**: Volume de operações por vendedor/agente comercial.

**Query SQL**:
```sql
-- Volume por vendedor
SELECT 
    a.Nome as Vendedor,
    COUNT(o.Id) as Total_Operacoes,
    SUM(o.ValorOperacao) as Valor_Total,
    AVG(o.ValorOperacao) as Ticket_Medio
FROM Operacao o
INNER JOIN Agente a ON o.AgenteId = a.Id
WHERE o.Status = 1  -- Fechado (OperacaoStatus.FECHADO)
  AND o.IsDeleted = 0  -- Ativo (IsDeleted.ATIVO)
  AND a.IsDeleted = 0  -- Ativo (IsDeleted.ATIVO)
  AND o.DataOperacao BETWEEN @DataInicio AND @DataFim
GROUP BY a.Id, a.Nome
ORDER BY Valor_Total DESC;
```

**Tabelas utilizadas**:
- `Operacao`
- `Agente`

**Campos enum utilizados**:
- `Operacao.Status` = 1 (Fechado)
- `Operacao.IsDeleted` = 0 (Ativo)
- `Agente.IsDeleted` = 0 (Ativo)

**Segmentação**:
- Por período
- Por modalidade
- Por cliente

---

### 8. Ticket Médio

**Descrição**: Valor médio das operações de factoring.

**Fórmula**:
```
Ticket_Medio = SUM(ValorOperacao) / COUNT(Operacoes)
```

**Query SQL**:
```sql
-- Ticket médio
SELECT 
    AVG(ValorOperacao) as Ticket_Medio,
    MIN(ValorOperacao) as Menor_Operacao,
    MAX(ValorOperacao) as Maior_Operacao,
    STDEV(ValorOperacao) as Desvio_Padrao
FROM Operacao
WHERE Status = 1  -- Fechado (OperacaoStatus.FECHADO)
  AND IsDeleted = 0  -- Ativo (IsDeleted.ATIVO)
  AND DataOperacao BETWEEN @DataInicio AND @DataFim;
```

**Tabelas utilizadas**:
- `Operacao`

**Campos enum utilizados**:
- `Operacao.Status` = 1 (Fechado)
- `Operacao.IsDeleted` = 0 (Ativo)

**Segmentação**:
- Por período
- Por cliente
- Por modalidade
- Por vendedor

---

### 9. Prazo Médio de Vencimento

**Descrição**: Prazo médio de vencimento dos documentos.

**Query SQL**:
```sql
-- Prazo médio de vencimento
SELECT 
    AVG(DATEDIFF(day, DataEmissao, DataVencimento)) as Prazo_Medio_Dias,
    MIN(DATEDIFF(day, DataEmissao, DataVencimento)) as Menor_Prazo,
    MAX(DATEDIFF(day, DataEmissao, DataVencimento)) as Maior_Prazo
FROM Documento
WHERE Status = 0  -- Aberto (DocumentoStatus.ABERTO)
  AND IsDeleted = 0;  -- Ativo (IsDeleted.ATIVO)
```

**Tabelas utilizadas**:
- `Documento`

**Campos enum utilizados**:
- `Documento.Status` = 0 (Aberto)
- `Documento.IsDeleted` = 0 (Ativo)

**Segmentação**:
- Por cliente
- Por sacado
- Por tipo de documento

---

### 10. Taxa de Liquidação

**Descrição**: Percentual de documentos liquidados em relação ao total de documentos baixados.

**Fórmula**:
```
Taxa_Liquidacao = (COUNT(Documentos Liquidados) / COUNT(Documentos Baixados)) * 100
```

**Query SQL**:
```sql
-- Taxa de liquidação
SELECT 
    COUNT(CASE WHEN TipoBaixa = 1 THEN 1 END) as Documentos_Liquidados,
    COUNT(*) as Total_Documentos_Baixados,
    COUNT(CASE WHEN TipoBaixa = 1 THEN 1 END) * 100.0 / COUNT(*) as Taxa_Liquidacao
FROM Documento
WHERE Status = 1  -- Baixado (DocumentoStatus.BAIXADO)
  AND IsDeleted = 0;  -- Ativo (IsDeleted.ATIVO)
```

**Tabelas utilizadas**:
- `Documento`

**Campos enum utilizados**:
- `Documento.Status` = 1 (Baixado)
- `Documento.TipoBaixa` = 1 (Liquidação)
- `Documento.IsDeleted` = 0 (Ativo)

**Segmentação**:
- Por período
- Por cliente
- Por tipo de recompra

---

### 11. Distribuição de Tipos de Baixa

**Descrição**: Análise da distribuição de tipos de baixa dos documentos.

**Query SQL**:
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
        ELSE 'Desconhecido'
    END as Tipo_Descricao,
    COUNT(*) as Quantidade,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as Percentual,
    SUM(ValorDocumento) as Valor_Total
FROM Documento
WHERE Status = 1  -- Baixado (DocumentoStatus.BAIXADO)
  AND IsDeleted = 0  -- Ativo (IsDeleted.ATIVO)
  AND DataBaixa BETWEEN @DataInicio AND @DataFim
GROUP BY TipoBaixa
ORDER BY Quantidade DESC;
```

**Tabelas utilizadas**:
- `Documento`

**Campos enum utilizados**:
- `Documento.Status` = 1 (Baixado)
- `Documento.TipoBaixa` (todos os valores)
- `Documento.IsDeleted` = 0 (Ativo)

**Observação**: Valores 2, 5 e 7 podem não ter registros no banco atual.

---

### 12. Taxa de Baixa Parcial

**Descrição**: Percentual de documentos com baixa parcial em relação ao total de documentos baixados.

**Fórmula**:
```
Taxa_Baixa_Parcial = (COUNT(Documentos Parciais) / COUNT(Documentos Baixados)) * 100
```

**Query SQL**:
```sql
-- Taxa de baixa parcial
SELECT 
    COUNT(CASE WHEN eParcial = 1 THEN 1 END) as Documentos_Parciais,
    COUNT(CASE WHEN eParcial = 0 THEN 1 END) as Documentos_Totais,
    COUNT(*) as Total_Documentos_Baixados,
    COUNT(CASE WHEN eParcial = 1 THEN 1 END) * 100.0 / COUNT(*) as Taxa_Baixa_Parcial
FROM Documento
WHERE Status = 1  -- Baixado (DocumentoStatus.BAIXADO)
  AND IsDeleted = 0;  -- Ativo (IsDeleted.ATIVO)
```

**Tabelas utilizadas**:
- `Documento`

**Campos enum utilizados**:
- `Documento.Status` = 1 (Baixado)
- `Documento.eParcial`:
  - 0 = Não Parcial
  - 1 = Parcial
- `Documento.IsDeleted` = 0 (Ativo)

**Segmentação**:
- Por período
- Por cliente
- Por valor

---

## 📊 Queries Auxiliares

### Relacionamento Documento-Cliente

**Observação Importante**: Documento não tem cliente vinculado diretamente. A estrutura é: `Documento → Operacao → Cliente`

**Query SQL**:
```sql
-- Obter cliente de um documento
SELECT 
    d.Id as DocumentoId,
    d.NumeroDocumento,
    o.Id as OperacaoId,
    c.Id as ClienteId,
    c.Nome as ClienteNome
FROM Documento d
INNER JOIN Operacao o ON d.OperacaoId = o.Id
INNER JOIN Cliente c ON o.ClienteId = c.Id
WHERE d.IsDeleted = 0
  AND o.IsDeleted = 0
  AND c.IsDeleted = 0;
```

---

### Análise de Estornos

**Tabela**: `DocumentoBaixaRecompra`

**Query SQL**:
```sql
-- Documentos com estorno
SELECT 
    d.Id as DocumentoId,
    d.NumeroDocumento,
    dbr.*
FROM Documento d
INNER JOIN DocumentoBaixaRecompra dbr ON d.Id = dbr.DocumentoId
WHERE d.IsDeleted = 0
  AND dbr.IsDeleted = 0;
```

---

## 🎯 Regras de Negócio Importantes

### 1. Soft Delete Universal

**Regra**: SEMPRE filtrar por `IsDeleted = 0` em todas as queries.

**Aplicação**: Em todas as tabelas do sistema.

**Exemplo**:
```sql
-- ❌ ERRADO - Não filtra IsDeleted
SELECT COUNT(*) FROM Operacao WHERE Status = 1;

-- ✅ CORRETO - Filtra IsDeleted
SELECT COUNT(*) FROM Operacao WHERE Status = 1 AND IsDeleted = 0;
```

---

### 2. Documentos Vencidos

**Regra**: Usar `ViewDocumentoAtrasoCalculo[Atraso]` ao invés de comparar datas manualmente.

**Motivo**: A view já considera regras de negócio (feriados, dias úteis, prorrogações, etc.).

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

---

### 3. Relacionamento Documento-Cliente

**Regra**: Documento não tem cliente direto, deve passar por Operação.

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

---

### 4. Operações Fechadas vs Abertas

**Regra**: Para KPIs financeiros (ROI, Volume), considerar apenas operações fechadas.

**Motivo**: Operações abertas ainda estão em andamento e podem ter valores alterados.

**Exemplo**:
```sql
-- ✅ CORRETO - Apenas operações fechadas
SELECT SUM(ValorOperacao)
FROM Operacao
WHERE Status = 1  -- Fechado
  AND IsDeleted = 0;
```

---

### 5. Taxa de Aprovação

**Regra**: Calcular sobre documentos analisados (Liberado + Rejeitado), excluindo Pendentes.

**Motivo**: Documentos pendentes ainda não foram analisados.

**Exemplo**:
```sql
-- ✅ CORRETO - Exclui pendentes do denominador
SELECT 
    COUNT(CASE WHEN StatusLiberacao = 1 THEN 1 END) * 100.0 / 
        NULLIF(COUNT(CASE WHEN StatusLiberacao IN (1, 2) THEN 1 END), 0) as Taxa_Aprovacao
FROM Documento
WHERE IsDeleted = 0;
```

---

## 📚 Referências

### Documentos Relacionados

- **Enums Confirmados**: `docs/ENUMS_CONFIRMADOS.md`
- **Constantes Python**: `app/constants/enums.py`
- **Especificação do Dashboard**: `docs/DASHBOARD_SPECIFICATION_V2.md`
- **Análise de Enums**: `docs/ENUMS_ANALISADOS.md`

### Fonte das Informações

- **Reunião FinanBlue**: 1 de novembro de 2025
- **Análise de Views**: Scripts `analyze_view_columns.py` e `extract_enum_meanings.py`
- **Validação**: Equipe técnica da FinanBlue

---

## ✅ Status de Validação

Todos os KPIs e queries deste documento foram **validados pela FinanBlue** e estão prontos para implementação.

| KPI | Status | Enums Utilizados | Observações |
|-----|--------|------------------|-------------|
| Volume de Operações | ✅ | Operacao.Status | Usar apenas operações fechadas |
| Taxa de Inadimplência | ✅ | ViewDocumentoAtrasoCalculo.Atraso | Usar view específica |
| Taxa de Recompra | ✅ | Documento.Tipo | Tipo = 1 (Recomprado) |
| ROI | ✅ | Operacao.Status | Usar apenas operações fechadas |
| Taxa de Aprovação | ✅ | Documento.StatusLiberacao | Excluir pendentes |
| Taxa de Perda | ✅ | Documento.TipoBaixa | TipoBaixa = 4 (Perda) |
| Volume por Vendedor | ✅ | Operacao.Status, Agente | JOIN com Agente |
| Ticket Médio | ✅ | Operacao.Status | Usar apenas operações fechadas |
| Prazo Médio | ✅ | Documento.Status | Usar apenas documentos abertos |
| Taxa de Liquidação | ✅ | Documento.TipoBaixa | TipoBaixa = 1 (Liquidação) |
| Distribuição de Baixas | ✅ | Documento.TipoBaixa | Todos os valores |
| Taxa de Baixa Parcial | ✅ | Documento.eParcial | eParcial = 1 (Parcial) |

---

**Documento validado e aprovado pela FinanBlue**  
**Última atualização**: 1 de novembro de 2025  
**Autor**: Dashboard Fonte Team  
**Versão**: 2.0 (Oficial)

