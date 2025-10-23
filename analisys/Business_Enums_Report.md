# Relatório de Campos Críticos para Segmentação

**Data de Extração:** 2025-10-23T00:13:33.281478  
**Banco de Dados:** livework_fonte  
**Esquema:** dbo

---

## Objetivo

Este relatório contém os valores reais extraídos dos campos mais importantes para:
- **Segmentação de gráficos e dashboards**
- **Cálculo de KPIs**
- **Filtros e análises de negócio**

---

## Sumário Executivo

- **Tabelas analisadas:** 8
- **Campos analisados:** 13

---

## Tabela: Operacao

### Campo: `Tipo`

**Descrição:** Tipo de operação de fomento  
**Tipo de Dado:** tinyint  
**Valores Distintos:** 1

**Distribuição de Valores:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `0` | 20,262 | 100.0% |

---

### Campo: `Status`

**Descrição:** Status atual da operação  
**Tipo de Dado:** tinyint  
**Valores Distintos:** 2

**Distribuição de Valores:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `1` | 20,259 | 99.99% |
| `0` | 3 | 0.01% |

---

### Campo: `ModalidadeId`

**Descrição:** Modalidade da operação (FK)  
**Tipo de Dado:** int  
**Valores Distintos:** 2

**Distribuição de Valores:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `2` | 20,196 | 99.67% |
| `32` | 66 | 0.33% |

---

## Tabela: Cliente

### Campo: `Tipo`

**Descrição:** Tipo de cliente  
**Tipo de Dado:** tinyint  
**Valores Distintos:** 1

**Distribuição de Valores:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `0` | 1,375 | 100.0% |

---

### ⚠️ Campo: `Status` (NÃO ENCONTRADO)

**Descrição:** Status do cliente

## Tabela: Sacado

### ⚠️ Campo: `Tipo` (NÃO ENCONTRADO)

**Descrição:** Tipo de sacado

### ⚠️ Campo: `Status` (NÃO ENCONTRADO)

**Descrição:** Status do sacado

## Tabela: Modalidade

**Tipo:** Tabela de Lookup (Referência)

| Id | Descricao |
|---|---|
| 1 | Convencional |
| 2 | Securitização |
| 4 | Fluxo Futuro |
| 6 | Cobrança |
| 8 | Fidc |
| 10 | Confissão Dívida |
| 15 | De/Para |
| 20 | Desconto Título de Crédito |
| 21 | Financiamento ESC |
| 22 | Empréstimo SG |
| 23 | Empréstimo CG |
| 24 | Empréstimo Garantia de Recebíveis |
| 25 | Empréstimo Garantia de Ativos |
| 27 | Cédula de Crédito Bancário |
| 32 | Comissária |
| 33 | Intercompany |
| 34 | Nota Comercial |
| 35 | Precatório |
| 36 | NPL |
| 37 | Convencional CCB |
| 38 | Crédito de Produtor Rural |
| 39 | Livecard |

---

## Tabela: TipoDoc

**Tipo:** Tabela de Lookup (Referência)

| Id | Descricao |
|---|---|
| 1 | Duplicata |
| 2 | Cheque |
| 3 | Nota Promissória |
| 4 | Recibo |
| 5 | Nota Fiscal |
| 6 | Nota de Seguro |
| 7 | Título |
| 8 | Boleto |
| 9 | Outros |
| 20 | Duplicata de Servicos |
| 21 | Contrato Físico |
| 30 | Duplicata Intercompany |
| 31 | Duplicata Comissaria |
| 32 | Cheque Comissaria |
| 33 | Duplicata Serviço Intercompany |
| 34 | Duplicata Serviço Comissaria |
| 40 | Cartão de Crédito SUB |
| 41 | Cartão de Crédito |
| 45 | Confissão de Dívida |
| 52 | Cédula de Crédito Bancário |
| 53 | Nota Comercial |
| 54 | Precatório |
| 65 | Crédito de Produtor Rural |

---

## Tabela: OperacaoCliente

### Campo: `Status`

**Descrição:** Status da relação operação-cliente  
**Tipo de Dado:** tinyint  
**Valores Distintos:** 1

**Distribuição de Valores:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `0` | 2 | 100.0% |

---

### Campo: `ModalidadeId`

**Descrição:** Modalidade (FK)  
**Tipo de Dado:** int  
**Valores Distintos:** 1

**Distribuição de Valores:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `0` | 2 | 100.0% |

---

## Tabela: OperacaoCheckList

### Campo: `Tipo`

**Descrição:** Tipo de checklist  
**Tipo de Dado:** tinyint  
**Valores Distintos:** 3

**Distribuição de Valores:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `99` | 12,413 | 68.39% |
| `0` | 5,630 | 31.02% |
| `1` | 107 | 0.59% |

---

### Campo: `Status`

**Descrição:** Status do checklist  
**Tipo de Dado:** tinyint  
**Valores Distintos:** 2

**Distribuição de Valores:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `1` | 12,643 | 69.66% |
| `2` | 5,507 | 30.34% |

---

## Tabela: OperacaoFechamento

### Campo: `Tipo`

**Descrição:** Tipo de fechamento  
**Tipo de Dado:** tinyint  
**Valores Distintos:** 7

**Distribuição de Valores:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `5` | 7,131 | 38.01% |
| `0` | 4,829 | 25.74% |
| `1` | 4,686 | 24.97% |
| `3` | 1,429 | 7.62% |
| `2` | 402 | 2.14% |
| `4` | 240 | 1.28% |
| `6` | 46 | 0.25% |

---

### Campo: `Status`

**Descrição:** Status do fechamento  
**Tipo de Dado:** tinyint  
**Valores Distintos:** 1

**Distribuição de Valores:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `0` | 18,763 | 100.0% |

---

## Insights e Recomendações

### Como Usar Estes Dados

1. **Filtros no Dashboard:**
   - Use os valores de `Operacao.Tipo` e `Operacao.Status` para criar filtros
   - Permita segmentação por `ModalidadeId` (referenciando a tabela Modalidade)

2. **Queries de KPIs:**
   - Atualize as queries SQL com os valores corretos de Status
   - Exemplo: `WHERE Operacao.Status = 1` (se 1 = Ativa)

3. **Gráficos:**
   - Crie gráficos segmentados por Tipo de Operação
   - Analise inadimplência por Modalidade
   - Compare performance entre diferentes Status

4. **Validação:**
   - Confirme com a equipe de negócio o significado de cada valor
   - Documente o mapeamento (ex: Status 1 = Ativa, 2 = Concluída, etc.)

### Próximos Passos

1. ✅ Valores extraídos do banco
2. ⏳ Validar significado com equipe de negócio
3. ⏳ Criar enums no código (Python/TypeScript)
4. ⏳ Atualizar queries de KPIs
5. ⏳ Implementar filtros no dashboard

---

**Relatório gerado por:** Manus AI  
**Data:** {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
