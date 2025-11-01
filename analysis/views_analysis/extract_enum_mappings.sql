-- Queries para Extração de Mapeamentos de Enum
-- Gerado automaticamente em: 2025-11-01 00:07:58
-- NÃO EDITE MANUALMENTE

-- ============================================================================

-- View: dbo.Bi_ViewBaixados
-- ----------------------------------------------------------------------------

-- TipoBaixa (tinyint) -> TipoBaixaDesc (varchar)
SELECT DISTINCT
    TipoBaixa AS Valor,
    TipoBaixaDesc AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.Bi_ViewBaixados
WHERE TipoBaixa IS NOT NULL
  AND TipoBaixaDesc IS NOT NULL
GROUP BY TipoBaixa, TipoBaixaDesc
ORDER BY TipoBaixa;

-- TipoRecompra (tinyint) -> TipoRecompraNome (varchar)
SELECT DISTINCT
    TipoRecompra AS Valor,
    TipoRecompraNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.Bi_ViewBaixados
WHERE TipoRecompra IS NOT NULL
  AND TipoRecompraNome IS NOT NULL
GROUP BY TipoRecompra, TipoRecompraNome
ORDER BY TipoRecompra;

-- DocumentoStatus (tinyint) -> DocumentoStatusNome (varchar)
SELECT DISTINCT
    DocumentoStatus AS Valor,
    DocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.Bi_ViewBaixados
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;


-- View: dbo.Bi_ViewChecagem
-- ----------------------------------------------------------------------------

-- ControladoriaDocumentoStatus (tinyint) -> ControladoriaDocumentoStatusNome (varchar)
SELECT DISTINCT
    ControladoriaDocumentoStatus AS Valor,
    ControladoriaDocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.Bi_ViewChecagem
WHERE ControladoriaDocumentoStatus IS NOT NULL
  AND ControladoriaDocumentoStatusNome IS NOT NULL
GROUP BY ControladoriaDocumentoStatus, ControladoriaDocumentoStatusNome
ORDER BY ControladoriaDocumentoStatus;


-- View: dbo.Bi_ViewVencimentos
-- ----------------------------------------------------------------------------

-- DocumentoStatus (tinyint) -> DocumentoStatusNome (varchar)
SELECT DISTINCT
    DocumentoStatus AS Valor,
    DocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.Bi_ViewVencimentos
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;


-- View: dbo.ViewAditivoRepresentante
-- ----------------------------------------------------------------------------

-- FuncaoRepresentante (tinyint) -> FuncaoRepresentanteNome (varchar)
SELECT DISTINCT
    FuncaoRepresentante AS Valor,
    FuncaoRepresentanteNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewAditivoRepresentante
WHERE FuncaoRepresentante IS NOT NULL
  AND FuncaoRepresentanteNome IS NOT NULL
GROUP BY FuncaoRepresentante, FuncaoRepresentanteNome
ORDER BY FuncaoRepresentante;


-- View: dbo.ViewBaixados
-- ----------------------------------------------------------------------------

-- TipoBaixa (tinyint) -> TipoBaixaDesc (varchar)
SELECT DISTINCT
    TipoBaixa AS Valor,
    TipoBaixaDesc AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixados
WHERE TipoBaixa IS NOT NULL
  AND TipoBaixaDesc IS NOT NULL
GROUP BY TipoBaixa, TipoBaixaDesc
ORDER BY TipoBaixa;

-- TipoRecompra (tinyint) -> TipoRecompraNome (varchar)
SELECT DISTINCT
    TipoRecompra AS Valor,
    TipoRecompraNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixados
WHERE TipoRecompra IS NOT NULL
  AND TipoRecompraNome IS NOT NULL
GROUP BY TipoRecompra, TipoRecompraNome
ORDER BY TipoRecompra;

-- DocumentoStatus (tinyint) -> DocumentoStatusNome (varchar)
SELECT DISTINCT
    DocumentoStatus AS Valor,
    DocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixados
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;


-- View: dbo.ViewBaixadosatraso
-- ----------------------------------------------------------------------------

-- TipoBaixa (tinyint) -> TipoBaixaDesc (varchar)
SELECT DISTINCT
    TipoBaixa AS Valor,
    TipoBaixaDesc AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixadosatraso
WHERE TipoBaixa IS NOT NULL
  AND TipoBaixaDesc IS NOT NULL
GROUP BY TipoBaixa, TipoBaixaDesc
ORDER BY TipoBaixa;

-- DocumentoStatus (tinyint) -> DocumentoStatusNome (varchar)
SELECT DISTINCT
    DocumentoStatus AS Valor,
    DocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixadosatraso
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;


-- View: dbo.ViewBaixadosContabil
-- ----------------------------------------------------------------------------

-- TipoBaixa (tinyint) -> TipoBaixaDesc (varchar)
SELECT DISTINCT
    TipoBaixa AS Valor,
    TipoBaixaDesc AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixadosContabil
WHERE TipoBaixa IS NOT NULL
  AND TipoBaixaDesc IS NOT NULL
GROUP BY TipoBaixa, TipoBaixaDesc
ORDER BY TipoBaixa;

-- TipoRecompra (tinyint) -> TipoRecompraNome (varchar)
SELECT DISTINCT
    TipoRecompra AS Valor,
    TipoRecompraNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixadosContabil
WHERE TipoRecompra IS NOT NULL
  AND TipoRecompraNome IS NOT NULL
GROUP BY TipoRecompra, TipoRecompraNome
ORDER BY TipoRecompra;

-- DocumentoStatus (tinyint) -> DocumentoStatusNome (varchar)
SELECT DISTINCT
    DocumentoStatus AS Valor,
    DocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixadosContabil
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;


-- View: dbo.ViewBaixadosVariavel
-- ----------------------------------------------------------------------------

-- TipoBaixa (tinyint) -> TipoBaixaDesc (varchar)
SELECT DISTINCT
    TipoBaixa AS Valor,
    TipoBaixaDesc AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixadosVariavel
WHERE TipoBaixa IS NOT NULL
  AND TipoBaixaDesc IS NOT NULL
GROUP BY TipoBaixa, TipoBaixaDesc
ORDER BY TipoBaixa;

-- TipoRecompra (tinyint) -> TipoRecompraNome (varchar)
SELECT DISTINCT
    TipoRecompra AS Valor,
    TipoRecompraNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixadosVariavel
WHERE TipoRecompra IS NOT NULL
  AND TipoRecompraNome IS NOT NULL
GROUP BY TipoRecompra, TipoRecompraNome
ORDER BY TipoRecompra;

-- DocumentoStatus (tinyint) -> DocumentoStatusNome (varchar)
SELECT DISTINCT
    DocumentoStatus AS Valor,
    DocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewBaixadosVariavel
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;


-- View: dbo.ViewBorderoDespesa
-- ----------------------------------------------------------------------------

-- Tiponumero (tinyint) -> Descricao (varchar)
SELECT DISTINCT
    Tiponumero AS Valor,
    Descricao AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewBorderoDespesa
WHERE Tiponumero IS NOT NULL
  AND Descricao IS NOT NULL
GROUP BY Tiponumero, Descricao
ORDER BY Tiponumero;


-- View: dbo.ViewChecagem
-- ----------------------------------------------------------------------------

-- ControladoriaDocumentoStatus (tinyint) -> ControladoriaDocumentoStatusNome (varchar)
SELECT DISTINCT
    ControladoriaDocumentoStatus AS Valor,
    ControladoriaDocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewChecagem
WHERE ControladoriaDocumentoStatus IS NOT NULL
  AND ControladoriaDocumentoStatusNome IS NOT NULL
GROUP BY ControladoriaDocumentoStatus, ControladoriaDocumentoStatusNome
ORDER BY ControladoriaDocumentoStatus;


-- View: dbo.ViewChecagemUsuario
-- ----------------------------------------------------------------------------

-- ControladoriaDocumentoStatus (tinyint) -> ControladoriaDocumentoStatusNome (varchar)
SELECT DISTINCT
    ControladoriaDocumentoStatus AS Valor,
    ControladoriaDocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewChecagemUsuario
WHERE ControladoriaDocumentoStatus IS NOT NULL
  AND ControladoriaDocumentoStatusNome IS NOT NULL
GROUP BY ControladoriaDocumentoStatus, ControladoriaDocumentoStatusNome
ORDER BY ControladoriaDocumentoStatus;


-- View: dbo.ViewContasAReceberaberto
-- ----------------------------------------------------------------------------

-- TipoPessoa (tinyint) -> TipoPessoaNome (varchar)
SELECT DISTINCT
    TipoPessoa AS Valor,
    TipoPessoaNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewContasAReceberaberto
WHERE TipoPessoa IS NOT NULL
  AND TipoPessoaNome IS NOT NULL
GROUP BY TipoPessoa, TipoPessoaNome
ORDER BY TipoPessoa;


-- View: dbo.ViewContasAReceberabertoSacado
-- ----------------------------------------------------------------------------

-- TipoPessoa (tinyint) -> TipoPessoaNome (varchar)
SELECT DISTINCT
    TipoPessoa AS Valor,
    TipoPessoaNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewContasAReceberabertoSacado
WHERE TipoPessoa IS NOT NULL
  AND TipoPessoaNome IS NOT NULL
GROUP BY TipoPessoa, TipoPessoaNome
ORDER BY TipoPessoa;


-- View: dbo.ViewContasAReceberabertoSint
-- ----------------------------------------------------------------------------

-- TipoPessoa (tinyint) -> TipoPessoaNome (varchar)
SELECT DISTINCT
    TipoPessoa AS Valor,
    TipoPessoaNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewContasAReceberabertoSint
WHERE TipoPessoa IS NOT NULL
  AND TipoPessoaNome IS NOT NULL
GROUP BY TipoPessoa, TipoPessoaNome
ORDER BY TipoPessoa;


-- View: dbo.ViewDocumentoFaixa
-- ----------------------------------------------------------------------------

-- TipoDocId (int) -> Descricao (varchar)
SELECT DISTINCT
    TipoDocId AS Valor,
    Descricao AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewDocumentoFaixa
WHERE TipoDocId IS NOT NULL
  AND Descricao IS NOT NULL
GROUP BY TipoDocId, Descricao
ORDER BY TipoDocId;


-- View: dbo.ViewLiquidezCliente
-- ----------------------------------------------------------------------------

-- Carteira (int) -> CarteiraDescricao (varchar)
SELECT DISTINCT
    Carteira AS Valor,
    CarteiraDescricao AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewLiquidezCliente
WHERE Carteira IS NOT NULL
  AND CarteiraDescricao IS NOT NULL
GROUP BY Carteira, CarteiraDescricao
ORDER BY Carteira;


-- View: dbo.ViewPagarReceberAnalitco
-- ----------------------------------------------------------------------------

-- TipoPessoa (tinyint) -> TipoPessoaNome (varchar)
SELECT DISTINCT
    TipoPessoa AS Valor,
    TipoPessoaNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewPagarReceberAnalitco
WHERE TipoPessoa IS NOT NULL
  AND TipoPessoaNome IS NOT NULL
GROUP BY TipoPessoa, TipoPessoaNome
ORDER BY TipoPessoa;


-- View: dbo.ViewProrrogado
-- ----------------------------------------------------------------------------

-- DocumentoStatus (tinyint) -> DocumentoStatusNome (varchar)
SELECT DISTINCT
    DocumentoStatus AS Valor,
    DocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewProrrogado
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;


-- View: dbo.ViewRepresentante
-- ----------------------------------------------------------------------------

-- FuncaoRepresentante (tinyint) -> FuncaoRepresentanteNome (varchar)
SELECT DISTINCT
    FuncaoRepresentante AS Valor,
    FuncaoRepresentanteNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewRepresentante
WHERE FuncaoRepresentante IS NOT NULL
  AND FuncaoRepresentanteNome IS NOT NULL
GROUP BY FuncaoRepresentante, FuncaoRepresentanteNome
ORDER BY FuncaoRepresentante;


-- View: dbo.ViewSimulacaoDespesa
-- ----------------------------------------------------------------------------

-- tipo (tinyint) -> Descricao (varchar)
SELECT DISTINCT
    tipo AS Valor,
    Descricao AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewSimulacaoDespesa
WHERE tipo IS NOT NULL
  AND Descricao IS NOT NULL
GROUP BY tipo, Descricao
ORDER BY tipo;


-- View: dbo.ViewTermoSecuritizacaoCaracteristica
-- ----------------------------------------------------------------------------

-- Numero (int) -> Descricao (varchar)
SELECT DISTINCT
    Numero AS Valor,
    Descricao AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewTermoSecuritizacaoCaracteristica
WHERE Numero IS NOT NULL
  AND Descricao IS NOT NULL
GROUP BY Numero, Descricao
ORDER BY Numero;

-- NumeroEmissao (smallint) -> Descricao (varchar)
SELECT DISTINCT
    NumeroEmissao AS Valor,
    Descricao AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewTermoSecuritizacaoCaracteristica
WHERE NumeroEmissao IS NOT NULL
  AND Descricao IS NOT NULL
GROUP BY NumeroEmissao, Descricao
ORDER BY NumeroEmissao;


-- View: dbo.ViewTermoSecuritizacaoSocio
-- ----------------------------------------------------------------------------

-- EstadoCivil (tinyint) -> EstadoCivilNome (varchar)
SELECT DISTINCT
    EstadoCivil AS Valor,
    EstadoCivilNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewTermoSecuritizacaoSocio
WHERE EstadoCivil IS NOT NULL
  AND EstadoCivilNome IS NOT NULL
GROUP BY EstadoCivil, EstadoCivilNome
ORDER BY EstadoCivil;


-- View: dbo.ViewVencimentos
-- ----------------------------------------------------------------------------

-- DocumentoStatus (tinyint) -> DocumentoStatusNome (varchar)
SELECT DISTINCT
    DocumentoStatus AS Valor,
    DocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewVencimentos
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;


-- View: dbo.ViewVencimentosBaixa
-- ----------------------------------------------------------------------------

-- DocumentoStatus (tinyint) -> DocumentoStatusNome (varchar)
SELECT DISTINCT
    DocumentoStatus AS Valor,
    DocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewVencimentosBaixa
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;


-- View: dbo.ViewVencimentosCartorio
-- ----------------------------------------------------------------------------

-- DocumentoStatus (tinyint) -> DocumentoStatusNome (varchar)
SELECT DISTINCT
    DocumentoStatus AS Valor,
    DocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewVencimentosCartorio
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;


-- View: dbo.ViewVencimentosChecagem
-- ----------------------------------------------------------------------------

-- DocumentoStatus (tinyint) -> DocumentoStatusNome (varchar)
SELECT DISTINCT
    DocumentoStatus AS Valor,
    DocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewVencimentosChecagem
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;


-- View: dbo.ViewVencimentosProtestado
-- ----------------------------------------------------------------------------

-- DocumentoStatus (tinyint) -> DocumentoStatusNome (varchar)
SELECT DISTINCT
    DocumentoStatus AS Valor,
    DocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewVencimentosProtestado
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;


-- View: dbo.ViewVencimentosTotal
-- ----------------------------------------------------------------------------

-- DocumentoStatus (tinyint) -> DocumentoStatusNome (varchar)
SELECT DISTINCT
    DocumentoStatus AS Valor,
    DocumentoStatusNome AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.ViewVencimentosTotal
WHERE DocumentoStatus IS NOT NULL
  AND DocumentoStatusNome IS NOT NULL
GROUP BY DocumentoStatus, DocumentoStatusNome
ORDER BY DocumentoStatus;


