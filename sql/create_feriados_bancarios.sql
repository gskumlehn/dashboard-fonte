-- ============================================================================
-- TABELA DE FERIADOS BANCÁRIOS
-- ============================================================================
-- Esta tabela armazena todos os feriados bancários nacionais e estaduais
-- para cálculo correto de dias úteis bancários
-- ============================================================================

-- Criar tabela de feriados bancários
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[FeriadosBancarios]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[FeriadosBancarios] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Data] DATE NOT NULL,
        [Descricao] NVARCHAR(200) NOT NULL,
        [Tipo] NVARCHAR(50) NOT NULL,  -- 'Nacional', 'Estadual', 'Municipal'
        [Estado] NVARCHAR(2) NULL,     -- Sigla do estado (para feriados estaduais)
        [Cidade] NVARCHAR(100) NULL,   -- Nome da cidade (para feriados municipais)
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [CreationTime] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_FeriadosBancarios_Data UNIQUE ([Data], [Estado], [Cidade])
    );
    
    CREATE INDEX IX_FeriadosBancarios_Data ON [dbo].[FeriadosBancarios]([Data]) WHERE IsDeleted = 0;
    CREATE INDEX IX_FeriadosBancarios_Estado ON [dbo].[FeriadosBancarios]([Estado]) WHERE IsDeleted = 0;
END
GO

-- ============================================================================
-- POPULAR FERIADOS BANCÁRIOS NACIONAIS
-- ============================================================================

-- Limpar dados existentes (se necessário)
-- DELETE FROM [dbo].[FeriadosBancarios];

-- Feriados Nacionais 2024
INSERT INTO [dbo].[FeriadosBancarios] ([Data], [Descricao], [Tipo], [Estado], [Cidade])
VALUES
    -- 2024
    ('2024-01-01', 'Confraternização Universal', 'Nacional', NULL, NULL),
    ('2024-02-13', 'Carnaval', 'Nacional', NULL, NULL),
    ('2024-02-14', 'Quarta-feira de Cinzas (até 14h)', 'Nacional', NULL, NULL),
    ('2024-03-29', 'Sexta-feira Santa', 'Nacional', NULL, NULL),
    ('2024-04-21', 'Tiradentes', 'Nacional', NULL, NULL),
    ('2024-05-01', 'Dia do Trabalho', 'Nacional', NULL, NULL),
    ('2024-05-30', 'Corpus Christi', 'Nacional', NULL, NULL),
    ('2024-09-07', 'Independência do Brasil', 'Nacional', NULL, NULL),
    ('2024-10-12', 'Nossa Senhora Aparecida', 'Nacional', NULL, NULL),
    ('2024-11-02', 'Finados', 'Nacional', NULL, NULL),
    ('2024-11-15', 'Proclamação da República', 'Nacional', NULL, NULL),
    ('2024-11-20', 'Dia da Consciência Negra', 'Nacional', NULL, NULL),
    ('2024-12-25', 'Natal', 'Nacional', NULL, NULL),
    
    -- 2025
    ('2025-01-01', 'Confraternização Universal', 'Nacional', NULL, NULL),
    ('2025-03-04', 'Carnaval', 'Nacional', NULL, NULL),
    ('2025-03-05', 'Quarta-feira de Cinzas (até 14h)', 'Nacional', NULL, NULL),
    ('2025-04-18', 'Sexta-feira Santa', 'Nacional', NULL, NULL),
    ('2025-04-21', 'Tiradentes', 'Nacional', NULL, NULL),
    ('2025-05-01', 'Dia do Trabalho', 'Nacional', NULL, NULL),
    ('2025-06-19', 'Corpus Christi', 'Nacional', NULL, NULL),
    ('2025-09-07', 'Independência do Brasil', 'Nacional', NULL, NULL),
    ('2025-10-12', 'Nossa Senhora Aparecida', 'Nacional', NULL, NULL),
    ('2025-11-02', 'Finados', 'Nacional', NULL, NULL),
    ('2025-11-15', 'Proclamação da República', 'Nacional', NULL, NULL),
    ('2025-11-20', 'Dia da Consciência Negra', 'Nacional', NULL, NULL),
    ('2025-12-25', 'Natal', 'Nacional', NULL, NULL),
    
    -- 2026
    ('2026-01-01', 'Confraternização Universal', 'Nacional', NULL, NULL),
    ('2026-02-17', 'Carnaval', 'Nacional', NULL, NULL),
    ('2026-02-18', 'Quarta-feira de Cinzas (até 14h)', 'Nacional', NULL, NULL),
    ('2026-04-03', 'Sexta-feira Santa', 'Nacional', NULL, NULL),
    ('2026-04-21', 'Tiradentes', 'Nacional', NULL, NULL),
    ('2026-05-01', 'Dia do Trabalho', 'Nacional', NULL, NULL),
    ('2026-06-04', 'Corpus Christi', 'Nacional', NULL, NULL),
    ('2026-09-07', 'Independência do Brasil', 'Nacional', NULL, NULL),
    ('2026-10-12', 'Nossa Senhora Aparecida', 'Nacional', NULL, NULL),
    ('2026-11-02', 'Finados', 'Nacional', NULL, NULL),
    ('2026-11-15', 'Proclamação da República', 'Nacional', NULL, NULL),
    ('2026-11-20', 'Dia da Consciência Negra', 'Nacional', NULL, NULL),
    ('2026-12-25', 'Natal', 'Nacional', NULL, NULL);

-- Feriados Estaduais de São Paulo (exemplo)
INSERT INTO [dbo].[FeriadosBancarios] ([Data], [Descricao], [Tipo], [Estado], [Cidade])
VALUES
    ('2024-07-09', 'Revolução Constitucionalista', 'Estadual', 'SP', NULL),
    ('2025-07-09', 'Revolução Constitucionalista', 'Estadual', 'SP', NULL),
    ('2026-07-09', 'Revolução Constitucionalista', 'Estadual', 'SP', NULL);

-- Feriados Municipais de São Paulo (exemplo)
INSERT INTO [dbo].[FeriadosBancarios] ([Data], [Descricao], [Tipo], [Estado], [Cidade])
VALUES
    ('2024-01-25', 'Aniversário de São Paulo', 'Municipal', 'SP', 'São Paulo'),
    ('2025-01-25', 'Aniversário de São Paulo', 'Municipal', 'SP', 'São Paulo'),
    ('2026-01-25', 'Aniversário de São Paulo', 'Municipal', 'SP', 'São Paulo');

GO

-- ============================================================================
-- FUNÇÃO: Verificar se uma data é dia útil bancário
-- ============================================================================

IF OBJECT_ID('dbo.fn_IsDiaUtilBancario', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_IsDiaUtilBancario;
GO

CREATE FUNCTION dbo.fn_IsDiaUtilBancario
(
    @Data DATE,
    @Estado NVARCHAR(2) = NULL,
    @Cidade NVARCHAR(100) = NULL
)
RETURNS BIT
AS
BEGIN
    DECLARE @IsDiaUtil BIT = 1;
    
    -- Verificar se é final de semana (Sábado = 7, Domingo = 1)
    IF DATEPART(WEEKDAY, @Data) IN (1, 7)
    BEGIN
        SET @IsDiaUtil = 0;
        RETURN @IsDiaUtil;
    END
    
    -- Verificar se é feriado nacional
    IF EXISTS (
        SELECT 1 
        FROM FeriadosBancarios 
        WHERE Data = @Data 
          AND Tipo = 'Nacional' 
          AND IsDeleted = 0
    )
    BEGIN
        SET @IsDiaUtil = 0;
        RETURN @IsDiaUtil;
    END
    
    -- Verificar se é feriado estadual (se estado foi informado)
    IF @Estado IS NOT NULL
    BEGIN
        IF EXISTS (
            SELECT 1 
            FROM FeriadosBancarios 
            WHERE Data = @Data 
              AND Tipo = 'Estadual'
              AND Estado = @Estado
              AND IsDeleted = 0
        )
        BEGIN
            SET @IsDiaUtil = 0;
            RETURN @IsDiaUtil;
        END
    END
    
    -- Verificar se é feriado municipal (se cidade foi informada)
    IF @Cidade IS NOT NULL
    BEGIN
        IF EXISTS (
            SELECT 1 
            FROM FeriadosBancarios 
            WHERE Data = @Data 
              AND Tipo = 'Municipal'
              AND Cidade = @Cidade
              AND IsDeleted = 0
        )
        BEGIN
            SET @IsDiaUtil = 0;
            RETURN @IsDiaUtil;
        END
    END
    
    RETURN @IsDiaUtil;
END
GO

-- ============================================================================
-- FUNÇÃO: Calcular próximo dia útil bancário
-- ============================================================================

IF OBJECT_ID('dbo.fn_ProximoDiaUtilBancario', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_ProximoDiaUtilBancario;
GO

CREATE FUNCTION dbo.fn_ProximoDiaUtilBancario
(
    @Data DATE,
    @Estado NVARCHAR(2) = NULL,
    @Cidade NVARCHAR(100) = NULL
)
RETURNS DATE
AS
BEGIN
    DECLARE @ProximoDiaUtil DATE = @Data;
    DECLARE @MaxIteracoes INT = 30;  -- Proteção contra loop infinito
    DECLARE @Contador INT = 0;
    
    -- Se a data já é dia útil, retorna ela mesma
    IF dbo.fn_IsDiaUtilBancario(@ProximoDiaUtil, @Estado, @Cidade) = 1
        RETURN @ProximoDiaUtil;
    
    -- Buscar próximo dia útil
    WHILE @Contador < @MaxIteracoes
    BEGIN
        SET @ProximoDiaUtil = DATEADD(DAY, 1, @ProximoDiaUtil);
        
        IF dbo.fn_IsDiaUtilBancario(@ProximoDiaUtil, @Estado, @Cidade) = 1
            BREAK;
        
        SET @Contador = @Contador + 1;
    END
    
    RETURN @ProximoDiaUtil;
END
GO

-- ============================================================================
-- FUNÇÃO: Calcular data de vencimento ajustada (considerando dias úteis)
-- ============================================================================

IF OBJECT_ID('dbo.fn_DataVencimentoAjustada', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_DataVencimentoAjustada;
GO

CREATE FUNCTION dbo.fn_DataVencimentoAjustada
(
    @DataVencimento DATE,
    @Estado NVARCHAR(2) = NULL,
    @Cidade NVARCHAR(100) = NULL
)
RETURNS DATE
AS
BEGIN
    -- Se o vencimento cai em dia não útil, ajusta para o próximo dia útil
    IF dbo.fn_IsDiaUtilBancario(@DataVencimento, @Estado, @Cidade) = 0
    BEGIN
        RETURN dbo.fn_ProximoDiaUtilBancario(@DataVencimento, @Estado, @Cidade);
    END
    
    RETURN @DataVencimento;
END
GO

-- ============================================================================
-- TESTES DAS FUNÇÕES
-- ============================================================================

-- Teste 1: Verificar se 01/11/2025 (sábado) é dia útil
SELECT dbo.fn_IsDiaUtilBancario('2025-11-01', NULL, NULL) as IsDiaUtil;  -- Deve retornar 0 (não é dia útil)

-- Teste 2: Verificar se 03/11/2025 (segunda) é dia útil
SELECT dbo.fn_IsDiaUtilBancario('2025-11-03', NULL, NULL) as IsDiaUtil;  -- Deve retornar 1 (é dia útil)

-- Teste 3: Verificar se 02/11/2025 (Finados) é dia útil
SELECT dbo.fn_IsDiaUtilBancario('2025-11-02', NULL, NULL) as IsDiaUtil;  -- Deve retornar 0 (feriado)

-- Teste 4: Próximo dia útil após 01/11/2025 (sábado)
SELECT dbo.fn_ProximoDiaUtilBancario('2025-11-01', NULL, NULL) as ProximoDiaUtil;  -- Deve retornar 03/11/2025 (segunda)

-- Teste 5: Data de vencimento ajustada
SELECT dbo.fn_DataVencimentoAjustada('2025-11-01', NULL, NULL) as VencimentoAjustado;  -- Deve retornar 03/11/2025

-- Teste 6: Listar todos os feriados de 2025
SELECT * FROM FeriadosBancarios WHERE YEAR(Data) = 2025 AND IsDeleted = 0 ORDER BY Data;

GO

PRINT 'Tabela FeriadosBancarios e funções criadas com sucesso!';
PRINT 'Total de feriados cadastrados: ' + CAST((SELECT COUNT(*) FROM FeriadosBancarios WHERE IsDeleted = 0) AS VARCHAR);

