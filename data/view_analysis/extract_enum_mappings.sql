-- ==============================================================================
-- QUERIES PARA EXTRAIR MAPEAMENTOS DE ENUM DAS VIEWS
-- ==============================================================================
-- Gerado em: 2025-10-31 23:45:04
-- Total de views com padrões: 24
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- VIEW: dbo.Bi_ViewBaixados
-- Padrões encontrados: 2
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.Bi_ViewChecagem
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.Bi_ViewVencimentos
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewAditivoRepresentante
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewBaixados
-- Padrões encontrados: 2
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewBaixadosatraso
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewBaixadosContabil
-- Padrões encontrados: 2
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewBaixadosVariavel
-- Padrões encontrados: 2
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewChecagem
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewChecagemUsuario
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewContasAReceberaberto
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewContasAReceberabertoSacado
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewContasAReceberabertoSint
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewLiquidezCliente
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewPagarReceberAnalitco
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewProrrogado
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewRepresentante
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewTermoSecuritizacaoSocio
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewVencimentos
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewVencimentosBaixa
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewVencimentosCartorio
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewVencimentosChecagem
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewVencimentosProtestado
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ------------------------------------------------------------------------------
-- VIEW: dbo.ViewVencimentosTotal
-- Padrões encontrados: 1
-- ------------------------------------------------------------------------------


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


-- ==============================================================================
-- FIM DAS QUERIES
-- ==============================================================================
