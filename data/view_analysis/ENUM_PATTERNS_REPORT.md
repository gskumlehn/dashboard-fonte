# Relatório de Análise de Padrões de Enum

**Data da Análise**: 2025-10-31 23:45:04

---

## 📊 Resumo

- **Views analisadas**: 24
- **Views com padrões de enum**: 24
- **Total de pares enum+descrição**: 28

---

## 🎯 Pares Enum + Descrição Encontrados

| View | Campo Enum | Campo Descrição | Padrão |
|------|------------|-----------------|--------|
| `dbo.Bi_ViewBaixados` | `TipoRecompra` | `TipoRecompraNome` | TipoRecompra + Nome |
| `dbo.Bi_ViewBaixados` | `DocumentoStatus` | `DocumentoStatusNome` | DocumentoStatus + Nome |
| `dbo.Bi_ViewChecagem` | `ControladoriaDocumentoStatus` | `ControladoriaDocumentoStatusNome` | ControladoriaDocumentoStatus + Nome |
| `dbo.Bi_ViewVencimentos` | `DocumentoStatus` | `DocumentoStatusNome` | DocumentoStatus + Nome |
| `dbo.ViewAditivoRepresentante` | `FuncaoRepresentante` | `FuncaoRepresentanteNome` | FuncaoRepresentante + Nome |
| `dbo.ViewBaixados` | `TipoRecompra` | `TipoRecompraNome` | TipoRecompra + Nome |
| `dbo.ViewBaixados` | `DocumentoStatus` | `DocumentoStatusNome` | DocumentoStatus + Nome |
| `dbo.ViewBaixadosatraso` | `DocumentoStatus` | `DocumentoStatusNome` | DocumentoStatus + Nome |
| `dbo.ViewBaixadosContabil` | `TipoRecompra` | `TipoRecompraNome` | TipoRecompra + Nome |
| `dbo.ViewBaixadosContabil` | `DocumentoStatus` | `DocumentoStatusNome` | DocumentoStatus + Nome |
| `dbo.ViewBaixadosVariavel` | `TipoRecompra` | `TipoRecompraNome` | TipoRecompra + Nome |
| `dbo.ViewBaixadosVariavel` | `DocumentoStatus` | `DocumentoStatusNome` | DocumentoStatus + Nome |
| `dbo.ViewChecagem` | `ControladoriaDocumentoStatus` | `ControladoriaDocumentoStatusNome` | ControladoriaDocumentoStatus + Nome |
| `dbo.ViewChecagemUsuario` | `ControladoriaDocumentoStatus` | `ControladoriaDocumentoStatusNome` | ControladoriaDocumentoStatus + Nome |
| `dbo.ViewContasAReceberaberto` | `TipoPessoa` | `TipoPessoaNome` | TipoPessoa + Nome |
| `dbo.ViewContasAReceberabertoSacado` | `TipoPessoa` | `TipoPessoaNome` | TipoPessoa + Nome |
| `dbo.ViewContasAReceberabertoSint` | `TipoPessoa` | `TipoPessoaNome` | TipoPessoa + Nome |
| `dbo.ViewLiquidezCliente` | `Carteira` | `CarteiraDescricao` | Carteira + Descricao |
| `dbo.ViewPagarReceberAnalitco` | `TipoPessoa` | `TipoPessoaNome` | TipoPessoa + Nome |
| `dbo.ViewProrrogado` | `DocumentoStatus` | `DocumentoStatusNome` | DocumentoStatus + Nome |
| `dbo.ViewRepresentante` | `FuncaoRepresentante` | `FuncaoRepresentanteNome` | FuncaoRepresentante + Nome |
| `dbo.ViewTermoSecuritizacaoSocio` | `EstadoCivil` | `EstadoCivilNome` | EstadoCivil + Nome |
| `dbo.ViewVencimentos` | `DocumentoStatus` | `DocumentoStatusNome` | DocumentoStatus + Nome |
| `dbo.ViewVencimentosBaixa` | `DocumentoStatus` | `DocumentoStatusNome` | DocumentoStatus + Nome |
| `dbo.ViewVencimentosCartorio` | `DocumentoStatus` | `DocumentoStatusNome` | DocumentoStatus + Nome |
| `dbo.ViewVencimentosChecagem` | `DocumentoStatus` | `DocumentoStatusNome` | DocumentoStatus + Nome |
| `dbo.ViewVencimentosProtestado` | `DocumentoStatus` | `DocumentoStatusNome` | DocumentoStatus + Nome |
| `dbo.ViewVencimentosTotal` | `DocumentoStatus` | `DocumentoStatusNome` | DocumentoStatus + Nome |

---

## 📋 Detalhamento por View

### dbo.Bi_ViewBaixados

**Colunas**: 68

**Padrões encontrados**: 2

- **TipoRecompra** (tinyint) → **TipoRecompraNome** (varchar)
- **DocumentoStatus** (tinyint) → **DocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: TipoRecompra → TipoRecompraNome
SELECT DISTINCT
    TipoRecompra,
    TipoRecompraNome,
    COUNT(*) AS Quantidade
FROM dbo.Bi_ViewBaixados
WHERE TipoRecompra IS NOT NULL
  AND TipoRecompraNome IS NOT NULL
GROUP BY TipoRecompra, TipoRecompraNome
ORDER BY TipoRecompra;


-- Mapeamento: DocumentoStatus → DocumentoStatusNome
SELECT DISTINCT
    DocumentoStatus,
    DocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.Bi_ViewBaixados
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;

```

---

### dbo.Bi_ViewChecagem

**Colunas**: 50

**Padrões encontrados**: 1

- **ControladoriaDocumentoStatus** (tinyint) → **ControladoriaDocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: ControladoriaDocumentoStatus → ControladoriaDocumentoStatusNome
SELECT DISTINCT
    ControladoriaDocumentoStatus,
    ControladoriaDocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.Bi_ViewChecagem
WHERE ControladoriaDocumentoStatus IS NOT NULL
  AND ControladoriaDocumentoStatusNome IS NOT NULL
GROUP BY ControladoriaDocumentoStatus, ControladoriaDocumentoStatusNome
ORDER BY ControladoriaDocumentoStatus;

```

---

### dbo.Bi_ViewVencimentos

**Colunas**: 60

**Padrões encontrados**: 1

- **DocumentoStatus** (tinyint) → **DocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: DocumentoStatus → DocumentoStatusNome
SELECT DISTINCT
    DocumentoStatus,
    DocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.Bi_ViewVencimentos
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;

```

---

### dbo.ViewAditivoRepresentante

**Colunas**: 9

**Padrões encontrados**: 1

- **FuncaoRepresentante** (tinyint) → **FuncaoRepresentanteNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: FuncaoRepresentante → FuncaoRepresentanteNome
SELECT DISTINCT
    FuncaoRepresentante,
    FuncaoRepresentanteNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewAditivoRepresentante
WHERE FuncaoRepresentante IS NOT NULL
  AND FuncaoRepresentanteNome IS NOT NULL
GROUP BY FuncaoRepresentante, FuncaoRepresentanteNome
ORDER BY FuncaoRepresentante;

```

---

### dbo.ViewBaixados

**Colunas**: 70

**Padrões encontrados**: 2

- **TipoRecompra** (tinyint) → **TipoRecompraNome** (varchar)
- **DocumentoStatus** (tinyint) → **DocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: TipoRecompra → TipoRecompraNome
SELECT DISTINCT
    TipoRecompra,
    TipoRecompraNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixados
WHERE TipoRecompra IS NOT NULL
  AND TipoRecompraNome IS NOT NULL
GROUP BY TipoRecompra, TipoRecompraNome
ORDER BY TipoRecompra;


-- Mapeamento: DocumentoStatus → DocumentoStatusNome
SELECT DISTINCT
    DocumentoStatus,
    DocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixados
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;

```

---

### dbo.ViewBaixadosatraso

**Colunas**: 69

**Padrões encontrados**: 1

- **DocumentoStatus** (tinyint) → **DocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: DocumentoStatus → DocumentoStatusNome
SELECT DISTINCT
    DocumentoStatus,
    DocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixadosatraso
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;

```

---

### dbo.ViewBaixadosContabil

**Colunas**: 71

**Padrões encontrados**: 2

- **TipoRecompra** (tinyint) → **TipoRecompraNome** (varchar)
- **DocumentoStatus** (tinyint) → **DocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: TipoRecompra → TipoRecompraNome
SELECT DISTINCT
    TipoRecompra,
    TipoRecompraNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixadosContabil
WHERE TipoRecompra IS NOT NULL
  AND TipoRecompraNome IS NOT NULL
GROUP BY TipoRecompra, TipoRecompraNome
ORDER BY TipoRecompra;


-- Mapeamento: DocumentoStatus → DocumentoStatusNome
SELECT DISTINCT
    DocumentoStatus,
    DocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixadosContabil
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;

```

---

### dbo.ViewBaixadosVariavel

**Colunas**: 71

**Padrões encontrados**: 2

- **TipoRecompra** (tinyint) → **TipoRecompraNome** (varchar)
- **DocumentoStatus** (tinyint) → **DocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: TipoRecompra → TipoRecompraNome
SELECT DISTINCT
    TipoRecompra,
    TipoRecompraNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixadosVariavel
WHERE TipoRecompra IS NOT NULL
  AND TipoRecompraNome IS NOT NULL
GROUP BY TipoRecompra, TipoRecompraNome
ORDER BY TipoRecompra;


-- Mapeamento: DocumentoStatus → DocumentoStatusNome
SELECT DISTINCT
    DocumentoStatus,
    DocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixadosVariavel
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;

```

---

### dbo.ViewChecagem

**Colunas**: 50

**Padrões encontrados**: 1

- **ControladoriaDocumentoStatus** (tinyint) → **ControladoriaDocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: ControladoriaDocumentoStatus → ControladoriaDocumentoStatusNome
SELECT DISTINCT
    ControladoriaDocumentoStatus,
    ControladoriaDocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewChecagem
WHERE ControladoriaDocumentoStatus IS NOT NULL
  AND ControladoriaDocumentoStatusNome IS NOT NULL
GROUP BY ControladoriaDocumentoStatus, ControladoriaDocumentoStatusNome
ORDER BY ControladoriaDocumentoStatus;

```

---

### dbo.ViewChecagemUsuario

**Colunas**: 52

**Padrões encontrados**: 1

- **ControladoriaDocumentoStatus** (tinyint) → **ControladoriaDocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: ControladoriaDocumentoStatus → ControladoriaDocumentoStatusNome
SELECT DISTINCT
    ControladoriaDocumentoStatus,
    ControladoriaDocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewChecagemUsuario
WHERE ControladoriaDocumentoStatus IS NOT NULL
  AND ControladoriaDocumentoStatusNome IS NOT NULL
GROUP BY ControladoriaDocumentoStatus, ControladoriaDocumentoStatusNome
ORDER BY ControladoriaDocumentoStatus;

```

---

### dbo.ViewContasAReceberaberto

**Colunas**: 26

**Padrões encontrados**: 1

- **TipoPessoa** (tinyint) → **TipoPessoaNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: TipoPessoa → TipoPessoaNome
SELECT DISTINCT
    TipoPessoa,
    TipoPessoaNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewContasAReceberaberto
WHERE TipoPessoa IS NOT NULL
  AND TipoPessoaNome IS NOT NULL
GROUP BY TipoPessoa, TipoPessoaNome
ORDER BY TipoPessoa;

```

---

### dbo.ViewContasAReceberabertoSacado

**Colunas**: 27

**Padrões encontrados**: 1

- **TipoPessoa** (tinyint) → **TipoPessoaNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: TipoPessoa → TipoPessoaNome
SELECT DISTINCT
    TipoPessoa,
    TipoPessoaNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewContasAReceberabertoSacado
WHERE TipoPessoa IS NOT NULL
  AND TipoPessoaNome IS NOT NULL
GROUP BY TipoPessoa, TipoPessoaNome
ORDER BY TipoPessoa;

```

---

### dbo.ViewContasAReceberabertoSint

**Colunas**: 22

**Padrões encontrados**: 1

- **TipoPessoa** (tinyint) → **TipoPessoaNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: TipoPessoa → TipoPessoaNome
SELECT DISTINCT
    TipoPessoa,
    TipoPessoaNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewContasAReceberabertoSint
WHERE TipoPessoa IS NOT NULL
  AND TipoPessoaNome IS NOT NULL
GROUP BY TipoPessoa, TipoPessoaNome
ORDER BY TipoPessoa;

```

---

### dbo.ViewLiquidezCliente

**Colunas**: 25

**Padrões encontrados**: 1

- **Carteira** (int) → **CarteiraDescricao** (varchar)

**Query de extração**:

```sql

-- Mapeamento: Carteira → CarteiraDescricao
SELECT DISTINCT
    Carteira,
    CarteiraDescricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewLiquidezCliente
WHERE Carteira IS NOT NULL
  AND CarteiraDescricao IS NOT NULL
GROUP BY Carteira, CarteiraDescricao
ORDER BY Carteira;

```

---

### dbo.ViewPagarReceberAnalitco

**Colunas**: 37

**Padrões encontrados**: 1

- **TipoPessoa** (tinyint) → **TipoPessoaNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: TipoPessoa → TipoPessoaNome
SELECT DISTINCT
    TipoPessoa,
    TipoPessoaNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewPagarReceberAnalitco
WHERE TipoPessoa IS NOT NULL
  AND TipoPessoaNome IS NOT NULL
GROUP BY TipoPessoa, TipoPessoaNome
ORDER BY TipoPessoa;

```

---

### dbo.ViewProrrogado

**Colunas**: 32

**Padrões encontrados**: 1

- **DocumentoStatus** (tinyint) → **DocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: DocumentoStatus → DocumentoStatusNome
SELECT DISTINCT
    DocumentoStatus,
    DocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewProrrogado
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;

```

---

### dbo.ViewRepresentante

**Colunas**: 52

**Padrões encontrados**: 1

- **FuncaoRepresentante** (tinyint) → **FuncaoRepresentanteNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: FuncaoRepresentante → FuncaoRepresentanteNome
SELECT DISTINCT
    FuncaoRepresentante,
    FuncaoRepresentanteNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewRepresentante
WHERE FuncaoRepresentante IS NOT NULL
  AND FuncaoRepresentanteNome IS NOT NULL
GROUP BY FuncaoRepresentante, FuncaoRepresentanteNome
ORDER BY FuncaoRepresentante;

```

---

### dbo.ViewTermoSecuritizacaoSocio

**Colunas**: 28

**Padrões encontrados**: 1

- **EstadoCivil** (tinyint) → **EstadoCivilNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: EstadoCivil → EstadoCivilNome
SELECT DISTINCT
    EstadoCivil,
    EstadoCivilNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewTermoSecuritizacaoSocio
WHERE EstadoCivil IS NOT NULL
  AND EstadoCivilNome IS NOT NULL
GROUP BY EstadoCivil, EstadoCivilNome
ORDER BY EstadoCivil;

```

---

### dbo.ViewVencimentos

**Colunas**: 63

**Padrões encontrados**: 1

- **DocumentoStatus** (tinyint) → **DocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: DocumentoStatus → DocumentoStatusNome
SELECT DISTINCT
    DocumentoStatus,
    DocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewVencimentos
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;

```

---

### dbo.ViewVencimentosBaixa

**Colunas**: 44

**Padrões encontrados**: 1

- **DocumentoStatus** (tinyint) → **DocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: DocumentoStatus → DocumentoStatusNome
SELECT DISTINCT
    DocumentoStatus,
    DocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewVencimentosBaixa
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;

```

---

### dbo.ViewVencimentosCartorio

**Colunas**: 49

**Padrões encontrados**: 1

- **DocumentoStatus** (tinyint) → **DocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: DocumentoStatus → DocumentoStatusNome
SELECT DISTINCT
    DocumentoStatus,
    DocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewVencimentosCartorio
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;

```

---

### dbo.ViewVencimentosChecagem

**Colunas**: 48

**Padrões encontrados**: 1

- **DocumentoStatus** (tinyint) → **DocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: DocumentoStatus → DocumentoStatusNome
SELECT DISTINCT
    DocumentoStatus,
    DocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewVencimentosChecagem
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;

```

---

### dbo.ViewVencimentosProtestado

**Colunas**: 48

**Padrões encontrados**: 1

- **DocumentoStatus** (tinyint) → **DocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: DocumentoStatus → DocumentoStatusNome
SELECT DISTINCT
    DocumentoStatus,
    DocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewVencimentosProtestado
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;

```

---

### dbo.ViewVencimentosTotal

**Colunas**: 61

**Padrões encontrados**: 1

- **DocumentoStatus** (tinyint) → **DocumentoStatusNome** (varchar)

**Query de extração**:

```sql

-- Mapeamento: DocumentoStatus → DocumentoStatusNome
SELECT DISTINCT
    DocumentoStatus,
    DocumentoStatusNome,
    COUNT(*) AS Quantidade
FROM dbo.ViewVencimentosTotal
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;

```

---

## 🚀 Próximos Passos

1. Execute as queries do arquivo `extract_enum_mappings.sql`
2. Analise os resultados para descobrir os valores de enum
3. Documente os mapeamentos encontrados
4. Atualize as queries do dashboard com os valores corretos

