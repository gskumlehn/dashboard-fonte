"""
Constantes de Enums - LiveWork Database

Este módulo contém todas as constantes de enum validadas pela FinanBlue.
Utilizar estas constantes em todas as queries para garantir consistência.

Data da Validação: 1 de novembro de 2025
Fonte: Reunião com equipe FinanBlue
Versão: 1.0 (Oficial)

NÃO EDITE MANUALMENTE - Valores validados pela FinanBlue
"""


class OperacaoStatus:
    """
    Status da operação de factoring
    
    Fonte: Reunião FinanBlue
    Tipo: tinyint
    """
    ABERTO = 0      # Operação em andamento, ainda não finalizada
    FECHADO = 1     # Operação concluída/finalizada
    
    _DESCRIPTIONS = {
        0: "Aberto",
        1: "Fechado",
    }
    
    @classmethod
    def get_description(cls, value):
        """Retorna a descrição do valor do enum"""
        return cls._DESCRIPTIONS.get(value, "Desconhecido")


class DocumentoStatus:
    """
    Status do documento/título
    
    Fonte: Reunião FinanBlue
    Tipo: tinyint
    
    Observação: Para verificar documentos vencidos, usar ViewDocumentoAtrasoCalculo[Atraso]
    """
    ABERTO = 0      # Documento em aberto, aguardando pagamento
    BAIXADO = 1     # Documento baixado/quitado
    
    _DESCRIPTIONS = {
        0: "Aberto",
        1: "Baixado",
    }
    
    @classmethod
    def get_description(cls, value):
        """Retorna a descrição do valor do enum"""
        return cls._DESCRIPTIONS.get(value, "Desconhecido")


class DocumentoStatusLiberacao:
    """
    Status de liberação de crédito do documento
    
    Fonte: Reunião FinanBlue
    Tipo: tinyint
    """
    PENDENTE = 0    # Aguardando análise/aprovação de crédito
    LIBERADO = 1    # Crédito aprovado e liberado
    REJEITADO = 2   # Crédito rejeitado/negado
    
    _DESCRIPTIONS = {
        0: "Pendente",
        1: "Liberado",
        2: "Rejeitado",
    }
    
    @classmethod
    def get_description(cls, value):
        """Retorna a descrição do valor do enum"""
        return cls._DESCRIPTIONS.get(value, "Desconhecido")


class DocumentoTipo:
    """
    Tipo de documento quanto à origem
    
    Fonte: Reunião FinanBlue
    Tipo: tinyint
    """
    BAIXADO_SACADO = 0      # Documento do sacado (devedor)
    RECOMPRADO_CLIENTE = 1  # Documento recomprado pelo cliente (cedente)
    
    _DESCRIPTIONS = {
        0: "Baixado/Sacado",
        1: "Recomprado/Cliente",
    }
    
    @classmethod
    def get_description(cls, value):
        """Retorna a descrição do valor do enum"""
        return cls._DESCRIPTIONS.get(value, "Desconhecido")


class DocumentoTipoBaixa:
    """
    Tipo de baixa do documento
    
    Fonte: Reunião FinanBlue (valores atualizados)
    Tipo: tinyint
    
    Observação: Valores 2, 5 e 7 foram adicionados pela FinanBlue
    (não apareceram na análise inicial de views)
    """
    BAIXA = 0                   # Baixa normal do documento
    LIQUIDACAO = 1              # Liquidação/pagamento do documento
    DEVOLUCAO = 2               # Devolução do documento
    TRANSFERENCIA = 3           # Transferência para outra carteira
    PERDA = 4                   # Perda/prejuízo (inadimplência confirmada)
    CONFISSAO_DIVIDA = 5        # Documento convertido em confissão de dívida
    BAIXA_POR_DEPOSITO = 6      # Baixa através de depósito judicial
    BAIXADO_PROTESTADO = 7      # Baixa de documento protestado
    
    _DESCRIPTIONS = {
        0: "Baixa",
        1: "Liquidação",
        2: "Devolução",
        3: "Transferência",
        4: "Perda",
        5: "Confissão de Dívida",
        6: "Baixa por Depósito",
        7: "Baixado Protestado",
    }
    
    @classmethod
    def get_description(cls, value):
        """Retorna a descrição do valor do enum"""
        return cls._DESCRIPTIONS.get(value, "Desconhecido")


class DocumentoEParcial:
    """
    Indica se o documento foi baixado parcialmente
    
    Fonte: Reunião FinanBlue
    Tipo: bit (boolean)
    """
    NAO_PARCIAL = 0  # Baixa total do documento
    PARCIAL = 1      # Baixa parcial do documento
    
    _DESCRIPTIONS = {
        0: "Não Parcial",
        1: "Parcial",
    }
    
    @classmethod
    def get_description(cls, value):
        """Retorna a descrição do valor do enum"""
        return cls._DESCRIPTIONS.get(value, "Desconhecido")


class TipoRecompra:
    """
    Tipo de recompra do documento
    
    Fonte: Análise de views (confirmado pela FinanBlue)
    Tipo: tinyint
    """
    NORMAL = 0      # Recompra normal pelo cliente
    COBRANCA = 1    # Recompra por cobrança
    
    _DESCRIPTIONS = {
        0: "Normal",
        1: "Cobrança",
    }
    
    @classmethod
    def get_description(cls, value):
        """Retorna a descrição do valor do enum"""
        return cls._DESCRIPTIONS.get(value, "Desconhecido")


class ControladoriaDocumentoStatus:
    """
    Status do documento na controladoria
    
    Fonte: Análise de views (confirmado pela FinanBlue)
    Tipo: tinyint
    """
    ABERTA = 0      # Documento em aberto na controladoria
    BAIXADA = 1     # Documento baixado na controladoria
    
    _DESCRIPTIONS = {
        0: "Aberta",
        1: "Baixada",
    }
    
    @classmethod
    def get_description(cls, value):
        """Retorna a descrição do valor do enum"""
        return cls._DESCRIPTIONS.get(value, "Desconhecido")


class IsDeleted:
    """
    Indica se o registro foi excluído logicamente (soft delete)
    
    Fonte: Reunião FinanBlue
    Tipo: bit (boolean)
    Aplicação: Presente em QUASE TODAS as tabelas do sistema
    
    IMPORTANTE: SEMPRE filtrar por IsDeleted = 0 em todas as queries
    """
    ATIVO = 0       # Registro ativo e válido
    EXCLUIDO = 1    # Registro excluído logicamente
    
    _DESCRIPTIONS = {
        0: "Ativo",
        1: "Excluído",
    }
    
    @classmethod
    def get_description(cls, value):
        """Retorna a descrição do valor do enum"""
        return cls._DESCRIPTIONS.get(value, "Desconhecido")


# ============================================================================
# EXEMPLOS DE USO
# ============================================================================

"""
Exemplos de como usar as constantes em queries:

1. Filtrar operações fechadas:
    query = f'''
        SELECT COUNT(*) 
        FROM Operacao 
        WHERE Status = {OperacaoStatus.FECHADO}
          AND IsDeleted = {IsDeleted.ATIVO}
    '''

2. Calcular taxa de recompra:
    query = f'''
        SELECT 
            COUNT(CASE WHEN Tipo = {DocumentoTipo.RECOMPRADO_CLIENTE} THEN 1 END) * 100.0 / COUNT(*) as Taxa_Recompra
        FROM Documento
        WHERE IsDeleted = {IsDeleted.ATIVO}
    '''

3. Filtrar documentos liberados:
    query = f'''
        SELECT * 
        FROM Documento
        WHERE StatusLiberacao = {DocumentoStatusLiberacao.LIBERADO}
          AND IsDeleted = {IsDeleted.ATIVO}
    '''

4. Analisar tipos de baixa:
    query = f'''
        SELECT 
            TipoBaixa,
            COUNT(*) as Quantidade
        FROM Documento
        WHERE Status = {DocumentoStatus.BAIXADO}
          AND TipoBaixa IN ({DocumentoTipoBaixa.LIQUIDACAO}, {DocumentoTipoBaixa.BAIXA})
          AND IsDeleted = {IsDeleted.ATIVO}
        GROUP BY TipoBaixa
    '''

5. Calcular taxa de perda:
    query = f'''
        SELECT 
            COUNT(CASE WHEN TipoBaixa = {DocumentoTipoBaixa.PERDA} THEN 1 END) * 100.0 / COUNT(*) as Taxa_Perda
        FROM Documento
        WHERE Status = {DocumentoStatus.BAIXADO}
          AND IsDeleted = {IsDeleted.ATIVO}
    '''
"""


# ============================================================================
# REGRAS DE NEGÓCIO IMPORTANTES
# ============================================================================

"""
REGRAS CONFIRMADAS PELA FINANBLUE:

1. SOFT DELETE UNIVERSAL
   - SEMPRE filtrar por IsDeleted = 0 em todas as queries
   - Aplicável a quase todas as tabelas do sistema

2. DOCUMENTOS VENCIDOS
   - Usar ViewDocumentoAtrasoCalculo[Atraso] ao invés de comparar datas
   - A view já considera regras de negócio (feriados, dias úteis, prorrogações)
   - Atraso > 0: Documento vencido
   - Atraso = 0: Documento em dia
   - Atraso < 0: Documento com vencimento futuro

3. RELACIONAMENTO DOCUMENTO-CLIENTE
   - Documento NÃO tem cliente vinculado diretamente
   - Estrutura: Documento → Operacao → Cliente
   - Sempre usar JOIN através de Operacao

4. INFORMAÇÕES DE ESTORNO
   - Informações de estorno ficam em DocumentoBaixaRecompra
   - Consultar esta tabela para análise de estornos

5. TIPOS DE BAIXA
   - Valores 2, 5 e 7 podem não ter registros no banco atual
   - São valores válidos no sistema, mas podem não estar em uso
"""

