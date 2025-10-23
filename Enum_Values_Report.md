# Relatório de Valores de Enum Extraídos

**Data de Extração:** 2025-10-22T23:42:16.196673  
**Banco de Dados:** livework_fonte  
**Esquema:** dbo

---

## Sumário

Total de tabelas analisadas: **4**

Total de campos analisados: **12**  
Tabelas prioritárias: **4**

### Tabelas Prioritárias

1. **Operacao** (5 campos)
2. **Cliente** (2 campos)
3. **Sacado** (1 campos)
4. **CadastroBase** (4 campos)

---

## Detalhamento por Tabela

### CadastroBase

**⚠️ TABELA PRIORITÁRIA - Usada em cálculo de KPIs**

#### Campo: `Estado`

- **Tipo:** char
- **Tamanho Máximo:** 2
- **Valores Distintos:** 34

**Valores encontrados:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `SC` | 24,306 | 57.16% |
| `PR` | 5,443 | 12.80% |
| `SP` | 2,944 | 6.92% |
| `RS` | 2,379 | 5.60% |
| `  ` | 1,953 | 4.59% |
| `MG` | 755 | 1.78% |
| `RJ` | 664 | 1.56% |
| `GO` | 466 | 1.10% |
| `BA` | 465 | 1.09% |
| `DF` | 352 | 0.83% |
| `PA` | 305 | 0.72% |
| `PE` | 298 | 0.70% |
| `MS` | 267 | 0.63% |
| `MT` | 253 | 0.60% |
| `NULL` | 224 | 0.53% |
| `ES` | 202 | 0.48% |
| `CE` | 197 | 0.46% |
| `MA` | 192 | 0.45% |
| `RO` | 148 | 0.35% |
| `AM` | 127 | 0.30% |

*... e mais 14 valores*

#### Campo: `Status`

- **Tipo:** bit
- **Tamanho Máximo:** 1
- **Valores Distintos:** 2

**Valores encontrados:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `1` | 42,291 | 99.46% |
| `0` | 229 | 0.54% |

#### Campo: `EmpresaSIMPLES`

- **Tipo:** bit
- **Tamanho Máximo:** 1
- **Valores Distintos:** 1

**Valores encontrados:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `0` | 42,520 | 100.00% |

#### Campo: `EmRecuperacaoJudicial`

- **Tipo:** bit
- **Tamanho Máximo:** 1
- **Valores Distintos:** 1

**Valores encontrados:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `0` | 42,520 | 100.00% |

---

### Cliente

**⚠️ TABELA PRIORITÁRIA - Usada em cálculo de KPIs**

#### Campo: `ENovo`

- **Tipo:** bit
- **Tamanho Máximo:** 1
- **Valores Distintos:** 2

**Valores encontrados:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `1` | 1,101 | 80.07% |
| `0` | 274 | 19.93% |

#### Campo: `Coobrigacao`

- **Tipo:** bit
- **Tamanho Máximo:** 1
- **Valores Distintos:** 1

**Valores encontrados:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `NULL` | 1,375 | 100.00% |

---

### Operacao

**⚠️ TABELA PRIORITÁRIA - Usada em cálculo de KPIs**

#### Campo: `ModalidadeId`

- **Tipo:** int
- **Tamanho Máximo:** 4
- **Valores Distintos:** 2

**Valores encontrados:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `2` | 20,196 | 99.67% |
| `32` | 66 | 0.33% |

#### Campo: `Coobrigacao`

- **Tipo:** bit
- **Tamanho Máximo:** 1
- **Valores Distintos:** 2

**Valores encontrados:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `NULL` | 10,869 | 53.64% |
| `0` | 9,393 | 46.36% |

#### Campo: `RecalculaOperacao`

- **Tipo:** bit
- **Tamanho Máximo:** 1
- **Valores Distintos:** 1

**Valores encontrados:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `1` | 20,262 | 100.00% |

#### Campo: `OrigemProposta`

- **Tipo:** int
- **Tamanho Máximo:** 4
- **Valores Distintos:** 1

**Valores encontrados:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `3` | 20,262 | 100.00% |

#### Campo: `DuplicataEndossada`

- **Tipo:** bit
- **Tamanho Máximo:** 1
- **Valores Distintos:** 2

**Valores encontrados:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `NULL` | 20,258 | 99.98% |
| `0` | 4 | 0.02% |

---

### Sacado

**⚠️ TABELA PRIORITÁRIA - Usada em cálculo de KPIs**

#### Campo: `ENovo`

- **Tipo:** bit
- **Tamanho Máximo:** 1
- **Valores Distintos:** 2

**Valores encontrados:**

| Valor | Quantidade | Percentual |
|-------|------------|------------|
| `0` | 39,798 | 99.82% |
| `1` | 70 | 0.18% |

---

## Insights e Recomendações

### Campos Críticos para KPIs

Com base nos valores extraídos, os seguintes campos devem ser utilizados nas queries de KPIs:


### Próximos Passos

1. **Validar os valores** com a equipe de negócio
2. **Atualizar as queries de KPIs** com os valores corretos
3. **Criar enums no código** para garantir type safety
4. **Documentar o significado** de cada valor de enum

---

**Relatório gerado automaticamente por:** Manus AI  
**Data:** 22/10/2025 23:42:26
