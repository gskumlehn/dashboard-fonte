-- ============================================================================
-- FUNÇÕES SIMPLIFICADAS PARA DIAS ÚTEIS (SEM TABELA DE FERIADOS)
-- ============================================================================
-- Versão simplificada que considera apenas fins de semana (sábado e domingo)
-- Feriados podem ser adicionados posteriormente
-- ============================================================================

-- ============================================================================
-- FUNÇÃO: Verificar se uma data é dia útil (apenas fins de semana)
-- ============================================================================

IF OBJECT_ID('dbo.fn_IsDiaUtilBancario', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_IsDiaUtilBancario;
GO

CREATE FUNCTION dbo.fn_IsDiaUtilBancario
(
    @Data DATE
)
RETURNS BIT
AS
BEGIN
    DECLARE @IsDiaUtil BIT = 1;
    DECLARE @DiaSemana INT;
    
    -- Obter dia da semana (1 = Domingo, 7 = Sábado)
    SET @DiaSemana = DATEPART(WEEKDAY, @Data);
    
    -- Verificar se é final de semana (Sábado = 7, Domingo = 1)
    IF @DiaSemana IN (1, 7)
    BEGIN
        SET @IsDiaUtil = 0;
    END
    
    RETURN @IsDiaUtil;
END
GO

-- ============================================================================
-- FUNÇÃO: Calcular próximo dia útil
-- ============================================================================

IF OBJECT_ID('dbo.fn_ProximoDiaUtilBancario', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_ProximoDiaUtilBancario;
GO

CREATE FUNCTION dbo.fn_ProximoDiaUtilBancario
(
    @Data DATE
)
RETURNS DATE
AS
BEGIN
    DECLARE @ProximoDiaUtil DATE = @Data;
    DECLARE @MaxIteracoes INT = 10;  -- Máximo 10 dias (suficiente para pular fins de semana)
    DECLARE @Contador INT = 0;
    
    -- Se a data já é dia útil, retorna ela mesma
    IF dbo.fn_IsDiaUtilBancario(@ProximoDiaUtil) = 1
        RETURN @ProximoDiaUtil;
    
    -- Buscar próximo dia útil
    WHILE @Contador < @MaxIteracoes
    BEGIN
        SET @ProximoDiaUtil = DATEADD(DAY, 1, @ProximoDiaUtil);
        
        IF dbo.fn_IsDiaUtilBancario(@ProximoDiaUtil) = 1
            BREAK;
        
        SET @Contador = @Contador + 1;
    END
    
    RETURN @ProximoDiaUtil;
END
GO

-- ============================================================================
-- FUNÇÃO: Calcular data de vencimento ajustada
-- ============================================================================

IF OBJECT_ID('dbo.fn_DataVencimentoAjustada', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_DataVencimentoAjustada;
GO

CREATE FUNCTION dbo.fn_DataVencimentoAjustada
(
    @DataVencimento DATE
)
RETURNS DATE
AS
BEGIN
    -- Se o vencimento cai em dia não útil, ajusta para o próximo dia útil
    IF dbo.fn_IsDiaUtilBancario(@DataVencimento) = 0
    BEGIN
        RETURN dbo.fn_ProximoDiaUtilBancario(@DataVencimento);
    END
    
    RETURN @DataVencimento;
END
GO

-- ============================================================================
-- TESTES DAS FUNÇÕES
-- ============================================================================

PRINT '========================================';
PRINT 'TESTES DAS FUNÇÕES DE DIAS ÚTEIS';
PRINT '========================================';
PRINT '';

-- Teste 1: Verificar se 01/11/2025 (sábado) é dia útil
DECLARE @Teste1 BIT = dbo.fn_IsDiaUtilBancario('2025-11-01');
PRINT 'Teste 1: 01/11/2025 (sábado) é dia útil?';
PRINT 'Resultado: ' + CAST(@Teste1 AS VARCHAR) + ' (esperado: 0)';
PRINT '';

-- Teste 2: Verificar se 03/11/2025 (segunda) é dia útil
DECLARE @Teste2 BIT = dbo.fn_IsDiaUtilBancario('2025-11-03');
PRINT 'Teste 2: 03/11/2025 (segunda) é dia útil?';
PRINT 'Resultado: ' + CAST(@Teste2 AS VARCHAR) + ' (esperado: 1)';
PRINT '';

-- Teste 3: Próximo dia útil após 01/11/2025 (sábado)
DECLARE @Teste3 DATE = dbo.fn_ProximoDiaUtilBancario('2025-11-01');
PRINT 'Teste 3: Próximo dia útil após 01/11/2025 (sábado)';
PRINT 'Resultado: ' + CONVERT(VARCHAR, @Teste3, 103) + ' (esperado: 03/11/2025)';
PRINT '';

-- Teste 4: Data de vencimento ajustada para 01/11/2025 (sábado)
DECLARE @Teste4 DATE = dbo.fn_DataVencimentoAjustada('2025-11-01');
PRINT 'Teste 4: Vencimento ajustado de 01/11/2025 (sábado)';
PRINT 'Resultado: ' + CONVERT(VARCHAR, @Teste4, 103) + ' (esperado: 03/11/2025)';
PRINT '';

-- Teste 5: Data de vencimento ajustada para 03/11/2025 (segunda - já é dia útil)
DECLARE @Teste5 DATE = dbo.fn_DataVencimentoAjustada('2025-11-03');
PRINT 'Teste 5: Vencimento ajustado de 03/11/2025 (segunda - já é dia útil)';
PRINT 'Resultado: ' + CONVERT(VARCHAR, @Teste5, 103) + ' (esperado: 03/11/2025)';
PRINT '';

-- Teste 6: Próximo dia útil após 02/11/2025 (domingo)
DECLARE @Teste6 DATE = dbo.fn_ProximoDiaUtilBancario('2025-11-02');
PRINT 'Teste 6: Próximo dia útil após 02/11/2025 (domingo)';
PRINT 'Resultado: ' + CONVERT(VARCHAR, @Teste6, 103) + ' (esperado: 03/11/2025)';
PRINT '';

PRINT '========================================';
PRINT 'FUNÇÕES CRIADAS COM SUCESSO!';
PRINT '========================================';
PRINT '';
PRINT 'Funções disponíveis:';
PRINT '- dbo.fn_IsDiaUtilBancario(@Data)';
PRINT '- dbo.fn_ProximoDiaUtilBancario(@Data)';
PRINT '- dbo.fn_DataVencimentoAjustada(@DataVencimento)';
PRINT '';
PRINT 'NOTA: Esta versão considera apenas fins de semana.';
PRINT 'Feriados bancários podem ser adicionados posteriormente.';

GO

