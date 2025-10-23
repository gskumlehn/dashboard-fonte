from app.infra.db_connection import Database

class ComercialService:
    @staticmethod
    def get_churn_data(page=1, items_per_page=10, sort_column="VolumeHistorico", sort_direction="DESC"):
        # Validação de entrada para evitar SQL Injection
        valid_sort_columns = ["ClienteNome", "UltimaData", "DiasInativo", "VolumeHistorico"]
        if sort_column not in valid_sort_columns:
            raise ValueError(f"Coluna de ordenação inválida: {sort_column}")
        if sort_direction.upper() not in ["ASC", "DESC"]:
            raise ValueError(f"Direção de ordenação inválida: {sort_direction}")

        offset = (page - 1) * items_per_page

        # SQL para buscar os dados de churn com paginação e ordenação
        query = f"""
        WITH UltimaOperacao AS (
            SELECT 
                ClienteId,
                MAX(Data) AS UltimaData
            FROM dbo.Operacao
            WHERE 
                IsDeleted = 0
            GROUP BY ClienteId
        ),
        ClientesInativos AS (
            SELECT 
                c.Id AS ClienteId,
                cb.Razao AS ClienteNome,
                uo.UltimaData,
                DATEDIFF(DAY, uo.UltimaData, GETDATE()) AS DiasInativo,
                (SELECT SUM(o2.ValorCompra) 
                 FROM dbo.Operacao o2
                 WHERE o2.ClienteId = c.Id
                   AND o2.IsDeleted = 0
                ) AS VolumeHistorico
            FROM dbo.Cliente c
            INNER JOIN UltimaOperacao uo ON c.Id = uo.ClienteId
            INNER JOIN dbo.CadastroBase cb ON c.CadastroBaseId = cb.Id
            WHERE 
                DATEDIFF(DAY, uo.UltimaData, GETDATE()) > 90
                AND cb.IsDeleted = 0
        )
        SELECT 
            ClienteNome,
            UltimaData,
            DiasInativo,
            VolumeHistorico
        FROM ClientesInativos
        ORDER BY {sort_column} {sort_direction}
        OFFSET {offset} ROWS FETCH NEXT {items_per_page} ROWS ONLY;
        """

        # Conecta ao banco e executa a query
        db = Database()
        try:
            results = db.execute_query(query)
            # Processa os resultados para adicionar o risco de churn
            churn_data = []
            for row in results:
                cliente_nome, ultima_data, dias_inativo, volume_historico = row
                if dias_inativo > 180:
                    risco = "Alto"
                elif dias_inativo > 120:
                    risco = "Médio"
                else:
                    risco = "Baixo"
                churn_data.append({
                    "cliente": cliente_nome,
                    "ultima_operacao": ultima_data.strftime('%Y-%m-%d'),
                    "dias_inativo": dias_inativo,
                    "volume_historico": volume_historico,
                    "risco": risco
                })
            return churn_data
        except Exception as e:
            raise RuntimeError(f"Erro ao buscar dados de churn: {e}")
        finally:
            db.close_connection()
