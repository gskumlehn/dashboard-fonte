# Análise de Significados dos Enums - LiveWork Database

**Data da Análise**: 31 de October de 2025, 23:24:13

**Data da Extração**: 2025-11-01T00:14:28.395300

**Total de Enums Extraídos**: 33

**Campos Enum Únicos**: 11

---

## 📊 Resumo Executivo

Este documento apresenta a análise detalhada de **11 campos enum** extraídos do banco de dados LiveWork, totalizando **210 valores únicos** e **2,130,442 registros** analisados.

### Classificação dos Enums

| Tipo | Quantidade | Descrição |
|------|------------|----------|
| **Boolean** | 2 | Campos binários (0/1, Sim/Não) |
| **Status/Workflow** | 1 | Campos de status e fluxo de trabalho |
| **Categórico** | 6 | Campos com múltiplas categorias |

---

## 🎯 Índice de Enums

### Enums Boolean

- [ControladoriaDocumentoStatus](#controladoriadocumentostatus)
- [TipoRecompra](#tiporecompra)

### Enums de Status/Workflow

- [DocumentoStatus](#documentostatus)

### Enums Categóricos

- [Carteira](#carteira)
- [FuncaoRepresentante](#funcaorepresentante)
- [Numero](#numero)
- [NumeroEmissao](#numeroemissao)
- [TipoBaixa](#tipobaixa)
- [TipoDocId](#tipodocid)
- [TipoPessoa](#tipopessoa)
- [Tiponumero](#tiponumero)

---

## 📋 Detalhamento dos Enums

### Carteira

**Tipo**: `int`

**Total de valores**: 5

**Total de registros**: 143,254

**Fonte**: `dbo.ViewLiquidezCliente` (campo: `CarteiraDescricao`)

**Classificação**: Categórico, Sequencial

#### Valores e Significados

| Valor | Descrição | Quantidade | % |
|-------|-----------|------------|---|
| `1` | Cobrança Simples | 142,537 | 99.5% |
| `2` | Cobrança Simples de Terceiros | 4 | 0.0% |
| `3` | Desconto | 1 | 0.0% |
| `4` | Pedido | 242 | 0.2% |
| `5` | Comissaria | 470 | 0.3% |

#### 💡 Interpretação

Este é um **campo categórico** que representa diferentes tipos ou categorias. Cada valor identifica uma classificação específica.

#### 📝 Exemplo de Uso em SQL

```sql
-- Filtrar por valor específico
WHERE Carteira = 1  -- Cobrança Simples

-- Filtrar por múltiplos valores
WHERE Carteira IN (1, 2, 3)
```

---

### ControladoriaDocumentoStatus

**Tipo**: `tinyint`

**Total de valores**: 2

**Total de registros**: 140,077

**Encontrado em 3 views**:

- `dbo.Bi_ViewChecagem` (campo: `ControladoriaDocumentoStatusNome`)
- `dbo.ViewChecagem` (campo: `ControladoriaDocumentoStatusNome`)
- `dbo.ViewChecagemUsuario` (campo: `ControladoriaDocumentoStatusNome`)

**Classificação**: Boolean, Sequencial

#### Valores e Significados

| Valor | Descrição | Quantidade | % |
|-------|-----------|------------|---|
| `0` | Aberta | 5,996 | 4.3% |
| `1` | Baixada | 134,081 | 95.7% |

#### 💡 Interpretação

Este é um **campo boolean** que representa uma condição binária (Sim/Não, Ativo/Inativo, etc.).

#### 📝 Exemplo de Uso em SQL

```sql
-- Filtrar por valor específico
WHERE ControladoriaDocumentoStatus = 0  -- Aberta

-- Filtrar por múltiplos valores
WHERE ControladoriaDocumentoStatus IN (0, 1)
```

---

### DocumentoStatus

**Tipo**: `tinyint`

**Total de valores**: 3

**Total de registros**: 768,375

**Encontrado em 12 views**:

- `dbo.Bi_ViewBaixados` (campo: `DocumentoStatusNome`)
- `dbo.Bi_ViewVencimentos` (campo: `DocumentoStatusNome`)
- `dbo.ViewBaixados` (campo: `DocumentoStatusNome`)
- `dbo.ViewBaixadosatraso` (campo: `DocumentoStatusNome`)
- `dbo.ViewBaixadosContabil` (campo: `DocumentoStatusNome`)
- `dbo.ViewProrrogado` (campo: `DocumentoStatusNome`)
- `dbo.ViewVencimentos` (campo: `DocumentoStatusNome`)
- `dbo.ViewVencimentosBaixa` (campo: `DocumentoStatusNome`)
- `dbo.ViewVencimentosCartorio` (campo: `DocumentoStatusNome`)
- `dbo.ViewVencimentosChecagem` (campo: `DocumentoStatusNome`)
- `dbo.ViewVencimentosProtestado` (campo: `DocumentoStatusNome`)
- `dbo.ViewVencimentosTotal` (campo: `DocumentoStatusNome`)

**Classificação**: Status/Workflow, Categórico, Sequencial

#### Valores e Significados

| Valor | Descrição | Quantidade | % |
|-------|-----------|------------|---|
| `0` | Entrada Importado | 48,073 | 6.3% |
| | *→ Aberto Estornado* | | |
| | *→ Aberto Estornado Em Cartorio Protestado* | | |
| | *→ Aberto Prorrogado* | | |
| `1` | Liquidado | 720,002 | 93.7% |
| | *→ Antecipado* | | |
| | *→ Atrasado* | | |
| | *→ Atrasado Em Cartorio Protestado* | | |
| `2` | Perda Atrasado | 300 | 0.0% |
| | *→ Perda Atrasado Em Cartorio Protestado* | | |
| | *→ Perda AtrASado* | | |
| | *→ Perda AtrASado Em Cartorio Protestado* | | |

#### 💡 Interpretação

Este é um **campo de status** que representa diferentes estados em um fluxo de trabalho. Os valores indicam a progressão de um processo de negócio.

⚠️ **Atenção**: 3 valor(es) possuem múltiplas descrições em diferentes views. Recomenda-se validar qual é a descrição correta com a equipe da FinanBlue.

#### 📝 Exemplo de Uso em SQL

```sql
-- Filtrar por valor específico
WHERE DocumentoStatus = 0  -- Entrada Importado

-- Filtrar por múltiplos valores
WHERE DocumentoStatus IN (0, 1, 2)
```

---

### FuncaoRepresentante

**Tipo**: `tinyint`

**Total de valores**: 8

**Total de registros**: 3,178

**Encontrado em 2 views**:

- `dbo.ViewAditivoRepresentante` (campo: `FuncaoRepresentanteNome`)
- `dbo.ViewRepresentante` (campo: `FuncaoRepresentanteNome`)

**Classificação**: Categórico, Com Gaps

#### Valores e Significados

| Valor | Descrição | Quantidade | % |
|-------|-----------|------------|---|
| `1` | Testemunha | 975 | 30.7% |
| | *→ Representante* | | |
| `2` | Sócio | 2 | 0.1% |
| | *→ Fiador/Avalista* | | |
| `3` | Interventor Judicial | 791 | 24.9% |
| | *→ Responsavel Solidario* | | |
| `4` | Avalista | 18 | 0.6% |
| | *→ Procurador* | | |
| `5` | Endossante | 823 | 25.9% |
| | *→ Fiel Depositario* | | |
| `11` | Fiador/Avalista | 565 | 17.8% |
| | *→ Sócio* | | |
| `13` | Responsável Solidário | 2 | 0.1% |
| | *→ Avalista* | | |
| `16` | Presidente | 2 | 0.1% |
| | *→ Administrador* | | |

#### 💡 Interpretação

Este é um **campo categórico** que representa diferentes tipos ou categorias. Cada valor identifica uma classificação específica.

⚠️ **Observação**: Este enum possui valores não sequenciais (gaps), indicando que alguns valores podem ter sido descontinuados ou reservados para uso futuro.

⚠️ **Atenção**: 8 valor(es) possuem múltiplas descrições em diferentes views. Recomenda-se validar qual é a descrição correta com a equipe da FinanBlue.

#### 📝 Exemplo de Uso em SQL

```sql
-- Filtrar por valor específico
WHERE FuncaoRepresentante = 1  -- Testemunha

-- Filtrar por múltiplos valores
WHERE FuncaoRepresentante IN (1, 2, 3)
```

---

### Numero

**Tipo**: `int`

**Total de valores**: 178

**Total de registros**: 178

**Fonte**: `dbo.ViewTermoSecuritizacaoCaracteristica` (campo: `Descricao`)

**Classificação**: Categórico, Sequencial

#### Valores e Significados

| Valor | Descrição | Quantidade | % |
|-------|-----------|------------|---|
| `1` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `2` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `3` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `4` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `5` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `6` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `7` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `8` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `9` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `10` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `11` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `12` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `13` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `14` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `15` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `16` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `17` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `18` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `19` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `20` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `21` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `22` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `23` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `24` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `25` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `26` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `27` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `28` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `29` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `30` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `31` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `32` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `33` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `34` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `35` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `36` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `37` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `38` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `39` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `40` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `41` | INTEGRALZACAO DE CAPITAL | 1 | 0.6% |
| `42` | INTEGRALZACAO DE CAPITAL | 1 | 0.6% |
| `43` | INTEGRALZACAO DE CAPITAL | 1 | 0.6% |
| `44` | INTEGRALZACAO DE CAPITAL | 1 | 0.6% |
| `45` | INTEGRALZACAO DE CAPITAL | 1 | 0.6% |
| `46` | INTEGRALZACAO DE CAPITAL | 1 | 0.6% |
| `47` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `48` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `49` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `50` | INTEGRALIZAC AO DE CAPITAL | 1 | 0.6% |
| `51` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `52` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `53` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `54` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `55` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `56` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `57` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `58` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `59` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `60` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `61` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `62` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `63` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `64` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `65` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `66` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `67` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `68` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `69` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `70` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `71` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `72` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `73` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `74` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `75` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `76` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `77` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `78` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `79` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `80` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `81` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `82` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `83` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `84` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `85` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `86` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `87` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `88` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `89` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `90` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `91` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `92` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `93` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `94` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `95` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `96` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `97` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `98` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `99` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `100` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `101` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `102` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `103` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `104` | INTEGTALIZACAO DE CAPITAL | 1 | 0.6% |
| `105` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `106` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `107` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `108` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `109` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `110` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `111` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `112` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `113` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `114` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `115` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `116` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `117` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `118` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `119` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `120` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `121` | INTEGRALIZACAO DE CAPITAL | 1 | 0.6% |
| `122` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `123` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `124` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `125` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `126` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `127` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `128` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `129` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `130` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `131` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `132` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `133` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `134` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `135` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `136` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `137` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `138` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `139` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `140` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `141` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `142` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `143` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `144` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `145` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `146` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `147` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `148` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `149` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `150` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `151` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `152` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `153` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `154` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `155` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `156` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `157` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `158` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `159` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `160` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `161` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `162` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `163` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `164` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `165` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `166` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `167` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `168` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `169` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `170` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `171` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `172` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `173` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `174` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `175` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `176` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `177` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |
| `178` | INTEGRALIZAÇÃO DE DEBÊNTURES | 1 | 0.6% |

#### 💡 Interpretação

Este é um **campo categórico** que representa diferentes tipos ou categorias. Cada valor identifica uma classificação específica.

#### 📝 Exemplo de Uso em SQL

```sql
-- Filtrar por valor específico
WHERE Numero = 1  -- INTEGRALIZACAO DE CAPITAL

-- Filtrar por múltiplos valores
WHERE Numero IN (1, 2, 3)
```

---

### NumeroEmissao

**Tipo**: `smallint`

**Total de valores**: 1

**Total de registros**: 178

**Fonte**: `dbo.ViewTermoSecuritizacaoCaracteristica` (campo: `Descricao`)

**Classificação**: Sequencial

#### Valores e Significados

| Valor | Descrição | Quantidade | % |
|-------|-----------|------------|---|
| `1` | INTEGRALIZACAO DE CAPITAL | 178 | 100.0% |
| | *→ INTEGRALIZAC AO DE CAPITAL* | | |
| | *→ INTEGRALIZAÇÃO DE DEBÊNTURES* | | |
| | *→ INTEGRALZACAO DE CAPITAL* | | |

#### 💡 Interpretação

⚠️ **Atenção**: 1 valor(es) possuem múltiplas descrições em diferentes views. Recomenda-se validar qual é a descrição correta com a equipe da FinanBlue.

#### 📝 Exemplo de Uso em SQL

```sql
-- Filtrar por valor específico
WHERE NumeroEmissao = 1  -- INTEGRALIZACAO DE CAPITAL

```

---

### TipoBaixa

**Tipo**: `tinyint`

**Total de valores**: 5

**Total de registros**: 444,048

**Encontrado em 4 views**:

- `dbo.Bi_ViewBaixados` (campo: `TipoBaixaDesc`)
- `dbo.ViewBaixados` (campo: `TipoBaixaDesc`)
- `dbo.ViewBaixadosatraso` (campo: `TipoBaixaDesc`)
- `dbo.ViewBaixadosContabil` (campo: `TipoBaixaDesc`)

**Classificação**: Categórico, Com Gaps

#### Valores e Significados

| Valor | Descrição | Quantidade | % |
|-------|-----------|------------|---|
| `0` | Baixa | 265,201 | 59.7% |
| `1` | Liquidação | 178,751 | 40.3% |
| `3` | Transferência | 8 | 0.0% |
| `4` | Perda | 85 | 0.0% |
| `6` | Baixa por Depósito | 3 | 0.0% |

#### 💡 Interpretação

Este é um **campo categórico** que representa diferentes tipos ou categorias. Cada valor identifica uma classificação específica.

⚠️ **Observação**: Este enum possui valores não sequenciais (gaps), indicando que alguns valores podem ter sido descontinuados ou reservados para uso futuro.

#### 📝 Exemplo de Uso em SQL

```sql
-- Filtrar por valor específico
WHERE TipoBaixa = 0  -- Baixa

-- Filtrar por múltiplos valores
WHERE TipoBaixa IN (0, 1, 3)
```

---

### TipoDocId

**Tipo**: `int`

**Total de valores**: 3

**Total de registros**: 10,703

**Fonte**: `dbo.ViewDocumentoFaixa` (campo: `Descricao`)

**Classificação**: Categórico, Sequencial

#### Valores e Significados

| Valor | Descrição | Quantidade | % |
|-------|-----------|------------|---|
| `1` | Duplicata | 10,660 | 99.6% |
| `2` | Cheque | 42 | 0.4% |
| `3` | Nota Promissória | 1 | 0.0% |

#### 💡 Interpretação

Este é um **campo categórico** que representa diferentes tipos ou categorias. Cada valor identifica uma classificação específica.

#### 📝 Exemplo de Uso em SQL

```sql
-- Filtrar por valor específico
WHERE TipoDocId = 1  -- Duplicata

-- Filtrar por múltiplos valores
WHERE TipoDocId IN (1, 2, 3)
```

---

### TipoPessoa

**Tipo**: `tinyint`

**Total de valores**: 1

**Total de registros**: 41,042

**Encontrado em 4 views**:

- `dbo.ViewContasAReceberaberto` (campo: `TipoPessoaNome`)
- `dbo.ViewContasAReceberabertoSacado` (campo: `TipoPessoaNome`)
- `dbo.ViewContasAReceberabertoSint` (campo: `TipoPessoaNome`)
- `dbo.ViewPagarReceberAnalitco` (campo: `TipoPessoaNome`)

**Classificação**: Sequencial

#### Valores e Significados

| Valor | Descrição | Quantidade | % |
|-------|-----------|------------|---|
| `2` | Cliente | 41,042 | 100.0% |

#### 💡 Interpretação

#### 📝 Exemplo de Uso em SQL

```sql
-- Filtrar por valor específico
WHERE TipoPessoa = 2  -- Cliente

```

---

### TipoRecompra

**Tipo**: `tinyint`

**Total de valores**: 2

**Total de registros**: 417,280

**Encontrado em 3 views**:

- `dbo.Bi_ViewBaixados` (campo: `TipoRecompraNome`)
- `dbo.ViewBaixados` (campo: `TipoRecompraNome`)
- `dbo.ViewBaixadosContabil` (campo: `TipoRecompraNome`)

**Classificação**: Boolean, Sequencial

#### Valores e Significados

| Valor | Descrição | Quantidade | % |
|-------|-----------|------------|---|
| `0` | Normal | 417,266 | 100.0% |
| `1` | Cobrança | 14 | 0.0% |

#### 💡 Interpretação

Este é um **campo boolean** que representa uma condição binária (Sim/Não, Ativo/Inativo, etc.).

#### 📝 Exemplo de Uso em SQL

```sql
-- Filtrar por valor específico
WHERE TipoRecompra = 0  -- Normal

-- Filtrar por múltiplos valores
WHERE TipoRecompra IN (0, 1)
```

---

### Tiponumero

**Tipo**: `tinyint`

**Total de valores**: 2

**Total de registros**: 162,129

**Fonte**: `dbo.ViewBorderoDespesa` (campo: `Descricao`)

**Classificação**: Sequencial

#### Valores e Significados

| Valor | Descrição | Quantidade | % |
|-------|-----------|------------|---|
| `4` | Despesa Bancária | 140,871 | 86.9% |
| | *→ Despesa Bancária - Reg. Cobrança* | | |
| | *→ Tarifa TED/PIX* | | |
| `5` | Tarifa TED/PIX | 21,258 | 13.1% |
| | *→ Adiantamento a Cliente* | | |
| | *→ Consulta de Crédito* | | |
| | *→ Despesa Bancária* | | |

#### 💡 Interpretação

⚠️ **Atenção**: 2 valor(es) possuem múltiplas descrições em diferentes views. Recomenda-se validar qual é a descrição correta com a equipe da FinanBlue.

#### 📝 Exemplo de Uso em SQL

```sql
-- Filtrar por valor específico
WHERE Tiponumero = 4  -- Despesa Bancária

-- Filtrar por múltiplos valores
WHERE Tiponumero IN (4, 5)
```

---

## 🎯 Enums Críticos para o Dashboard

Os seguintes enums são **críticos** para o cálculo dos KPIs do dashboard:

### Status

**Importância**: Status de operações e documentos

**Campo**: `DocumentoStatus`

**Valores principais**:

- `0` = Entrada Importado (48,073 registros)
- `1` = Liquidado (720,002 registros)
- `2` = Perda Atrasado (300 registros)

**Campo**: `ControladoriaDocumentoStatus`

**Valores principais**:

- `0` = Aberta (5,996 registros)
- `1` = Baixada (134,081 registros)

---

### DocumentoStatus

**Importância**: Status de documentos (crítico para Taxa de Inadimplência)

**Campo**: `DocumentoStatus`

**Valores principais**:

- `0` = Entrada Importado (48,073 registros)
- `1` = Liquidado (720,002 registros)
- `2` = Perda Atrasado (300 registros)

**Campo**: `ControladoriaDocumentoStatus`

**Valores principais**:

- `0` = Aberta (5,996 registros)
- `1` = Baixada (134,081 registros)

---

### TipoRecompra

**Importância**: Tipo de recompra (crítico para Taxa de Recompra)

**Campo**: `TipoRecompra`

**Valores principais**:

- `0` = Normal (417,266 registros)
- `1` = Cobrança (14 registros)

---

### TipoBaixa

**Importância**: Tipo de baixa de documentos

**Campo**: `TipoBaixa`

**Valores principais**:

- `0` = Baixa (265,201 registros)
- `1` = Liquidação (178,751 registros)
- `3` = Transferência (8 registros)
- `4` = Perda (85 registros)
- `6` = Baixa por Depósito (3 registros)

---

### ControladoriaDocumentoStatus

**Importância**: Status na controladoria

**Campo**: `ControladoriaDocumentoStatus`

**Valores principais**:

- `0` = Aberta (5,996 registros)
- `1` = Baixada (134,081 registros)

---

## 🚀 Próximos Passos

1. **Revisar** os enums críticos listados acima
2. **Validar** significados com a equipe da FinanBlue
3. **Atualizar** queries do dashboard com valores confirmados
4. **Testar** KPIs com dados reais
5. **Documentar** regras de negócio específicas

---

## 📚 Referências

- **Arquivo JSON original**: `pasted_file_7aNHmF_enum_mappings.json`
- **Especificação de KPIs**: `docs/KPI_Calculation_Specification.md`
- **Especificação do Dashboard**: `docs/DASHBOARD_SPECIFICATION_V2.md`
- **Perguntas para FinanBlue**: `docs/PERGUNTAS_REUNIAO_FINANBLUE.md`

---

**Documento gerado automaticamente em**: 31/10/2025 às 23:24:13

**Autor**: Dashboard Fonte Team
