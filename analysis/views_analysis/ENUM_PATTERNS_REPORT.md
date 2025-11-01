# Análise de Padrões de Enum em Views

**Data da Análise**: 2025-11-01 00:07:58

---

## 📊 Resumo

- **Total de views analisadas**: 238
- **Views com padrões de enum**: 28
- **Total de pares enum+descrição**: 38

---

## 📈 Estatísticas por Tipo de Padrão

| Padrão | Quantidade |
|--------|------------|
| `Nome` | 27 |
| `Descricao` | 6 |
| `Desc` | 5 |

---

## 📋 Views com Padrões Identificados

### dbo.Bi_ViewBaixados

**Total de colunas**: 68

**Padrões encontrados**: 3

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `TipoBaixa` | `tinyint` | `TipoBaixaDesc` | `varchar` | `TipoBaixa+Desc` |
| `TipoRecompra` | `tinyint` | `TipoRecompraNome` | `varchar` | `TipoRecompra+Nome` |
| `DocumentoStatus` | `tinyint` | `DocumentoStatusNome` | `varchar` | `DocumentoStatus+Nome` |

### dbo.Bi_ViewChecagem

**Total de colunas**: 50

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `ControladoriaDocumentoStatus` | `tinyint` | `ControladoriaDocumentoStatusNome` | `varchar` | `ControladoriaDocumentoStatus+Nome` |

### dbo.Bi_ViewVencimentos

**Total de colunas**: 60

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `DocumentoStatus` | `tinyint` | `DocumentoStatusNome` | `varchar` | `DocumentoStatus+Nome` |

### dbo.ViewAditivoRepresentante

**Total de colunas**: 9

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `FuncaoRepresentante` | `tinyint` | `FuncaoRepresentanteNome` | `varchar` | `FuncaoRepresentante+Nome` |

### dbo.ViewBaixados

**Total de colunas**: 70

**Padrões encontrados**: 3

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `TipoBaixa` | `tinyint` | `TipoBaixaDesc` | `varchar` | `TipoBaixa+Desc` |
| `TipoRecompra` | `tinyint` | `TipoRecompraNome` | `varchar` | `TipoRecompra+Nome` |
| `DocumentoStatus` | `tinyint` | `DocumentoStatusNome` | `varchar` | `DocumentoStatus+Nome` |

### dbo.ViewBaixadosatraso

**Total de colunas**: 69

**Padrões encontrados**: 2

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `TipoBaixa` | `tinyint` | `TipoBaixaDesc` | `varchar` | `TipoBaixa+Desc` |
| `DocumentoStatus` | `tinyint` | `DocumentoStatusNome` | `varchar` | `DocumentoStatus+Nome` |

### dbo.ViewBaixadosContabil

**Total de colunas**: 71

**Padrões encontrados**: 3

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `TipoBaixa` | `tinyint` | `TipoBaixaDesc` | `varchar` | `TipoBaixa+Desc` |
| `TipoRecompra` | `tinyint` | `TipoRecompraNome` | `varchar` | `TipoRecompra+Nome` |
| `DocumentoStatus` | `tinyint` | `DocumentoStatusNome` | `varchar` | `DocumentoStatus+Nome` |

### dbo.ViewBaixadosVariavel

**Total de colunas**: 71

**Padrões encontrados**: 3

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `TipoBaixa` | `tinyint` | `TipoBaixaDesc` | `varchar` | `TipoBaixa+Desc` |
| `TipoRecompra` | `tinyint` | `TipoRecompraNome` | `varchar` | `TipoRecompra+Nome` |
| `DocumentoStatus` | `tinyint` | `DocumentoStatusNome` | `varchar` | `DocumentoStatus+Nome` |

### dbo.ViewBorderoDespesa

**Total de colunas**: 8

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `Tiponumero` | `tinyint` | `Descricao` | `varchar` | `Tiponumero+Descricao` |

### dbo.ViewChecagem

**Total de colunas**: 50

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `ControladoriaDocumentoStatus` | `tinyint` | `ControladoriaDocumentoStatusNome` | `varchar` | `ControladoriaDocumentoStatus+Nome` |

### dbo.ViewChecagemUsuario

**Total de colunas**: 52

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `ControladoriaDocumentoStatus` | `tinyint` | `ControladoriaDocumentoStatusNome` | `varchar` | `ControladoriaDocumentoStatus+Nome` |

### dbo.ViewContasAReceberaberto

**Total de colunas**: 26

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `TipoPessoa` | `tinyint` | `TipoPessoaNome` | `varchar` | `TipoPessoa+Nome` |

### dbo.ViewContasAReceberabertoSacado

**Total de colunas**: 27

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `TipoPessoa` | `tinyint` | `TipoPessoaNome` | `varchar` | `TipoPessoa+Nome` |

### dbo.ViewContasAReceberabertoSint

**Total de colunas**: 22

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `TipoPessoa` | `tinyint` | `TipoPessoaNome` | `varchar` | `TipoPessoa+Nome` |

### dbo.ViewDocumentoFaixa

**Total de colunas**: 9

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `TipoDocId` | `int` | `Descricao` | `varchar` | `TipoDocId+Descricao` |

### dbo.ViewLiquidezCliente

**Total de colunas**: 25

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `Carteira` | `int` | `CarteiraDescricao` | `varchar` | `Carteira+Descricao` |

### dbo.ViewPagarReceberAnalitco

**Total de colunas**: 37

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `TipoPessoa` | `tinyint` | `TipoPessoaNome` | `varchar` | `TipoPessoa+Nome` |

### dbo.ViewProrrogado

**Total de colunas**: 32

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `DocumentoStatus` | `tinyint` | `DocumentoStatusNome` | `varchar` | `DocumentoStatus+Nome` |

### dbo.ViewRepresentante

**Total de colunas**: 52

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `FuncaoRepresentante` | `tinyint` | `FuncaoRepresentanteNome` | `varchar` | `FuncaoRepresentante+Nome` |

### dbo.ViewSimulacaoDespesa

**Total de colunas**: 5

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `tipo` | `tinyint` | `Descricao` | `varchar` | `tipo+Descricao` |

### dbo.ViewTermoSecuritizacaoCaracteristica

**Total de colunas**: 9

**Padrões encontrados**: 2

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `Numero` | `int` | `Descricao` | `varchar` | `Numero+Descricao` |
| `NumeroEmissao` | `smallint` | `Descricao` | `varchar` | `NumeroEmissao+Descricao` |

### dbo.ViewTermoSecuritizacaoSocio

**Total de colunas**: 28

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `EstadoCivil` | `tinyint` | `EstadoCivilNome` | `varchar` | `EstadoCivil+Nome` |

### dbo.ViewVencimentos

**Total de colunas**: 63

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `DocumentoStatus` | `tinyint` | `DocumentoStatusNome` | `varchar` | `DocumentoStatus+Nome` |

### dbo.ViewVencimentosBaixa

**Total de colunas**: 44

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `DocumentoStatus` | `tinyint` | `DocumentoStatusNome` | `varchar` | `DocumentoStatus+Nome` |

### dbo.ViewVencimentosCartorio

**Total de colunas**: 49

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `DocumentoStatus` | `tinyint` | `DocumentoStatusNome` | `varchar` | `DocumentoStatus+Nome` |

### dbo.ViewVencimentosChecagem

**Total de colunas**: 48

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `DocumentoStatus` | `tinyint` | `DocumentoStatusNome` | `varchar` | `DocumentoStatus+Nome` |

### dbo.ViewVencimentosProtestado

**Total de colunas**: 48

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `DocumentoStatus` | `tinyint` | `DocumentoStatusNome` | `varchar` | `DocumentoStatus+Nome` |

### dbo.ViewVencimentosTotal

**Total de colunas**: 61

**Padrões encontrados**: 1

| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |
|------------|------|-----------------|------|--------|
| `DocumentoStatus` | `tinyint` | `DocumentoStatusNome` | `varchar` | `DocumentoStatus+Nome` |

---

## 🎯 Campos Enum Mais Comuns

| Campo | Ocorrências |
|-------|-------------|
| `DocumentoStatus` | 13 |
| `TipoBaixa` | 5 |
| `TipoRecompra` | 4 |
| `TipoPessoa` | 4 |
| `ControladoriaDocumentoStatus` | 3 |
| `FuncaoRepresentante` | 2 |
| `Tiponumero` | 1 |
| `TipoDocId` | 1 |
| `Carteira` | 1 |
| `tipo` | 1 |
| `Numero` | 1 |
| `NumeroEmissao` | 1 |
| `EstadoCivil` | 1 |

---

## 🚀 Próximos Passos

1. **Executar** o script `extract_enum_meanings.py` para extrair os valores
2. **Revisar** os mapeamentos extraídos
3. **Validar** com a equipe da FinanBlue
4. **Atualizar** as queries do dashboard

---

## 📚 Arquivos Gerados

- **Metadados JSON**: `/home/gabe/Documents/Fonte/dashboard-fonte/analysis/views_analysis/view_analysis_metadata.json`
- **Queries SQL**: `/home/gabe/Documents/Fonte/dashboard-fonte/analysis/views_analysis/extract_enum_mappings.sql`
- **Este relatório**: `/home/gabe/Documents/Fonte/dashboard-fonte/analysis/views_analysis/ENUM_PATTERNS_REPORT.md`

