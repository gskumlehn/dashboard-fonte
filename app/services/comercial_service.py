from app.infra.db_connection import Database

class ComercialService:
    @staticmethod
    def get_client_data(page=1, items_per_page=10, sort_column="HistoricalVolume", sort_direction="DESC", risk_filter=""):
        valid_sort_columns = ["ClientName", "LastDate", "InactiveDays", "HistoricalVolume"]
        if sort_column not in valid_sort_columns:
            raise ValueError(f"Invalid sort column: {sort_column}")
        if sort_direction.upper() not in ["ASC", "DESC"]:
            raise ValueError(f"Invalid sort direction: {sort_direction}")

        offset = (page - 1) * items_per_page

        risk_conditions = {
            "Consumado": "InactiveDays > 120",
            "Alto": "InactiveDays BETWEEN 91 AND 120",
            "Médio": "InactiveDays BETWEEN 61 AND 90",
            "Baixo": "InactiveDays BETWEEN 31 AND 60",
            "-": "InactiveDays <= 30"
        }
        risk_condition = risk_conditions.get(risk_filter, "1=1")

        query = f"""
        WITH LastOperation AS (
            SELECT 
                ClienteId,
                MAX(Data) AS LastDate
            FROM dbo.Operacao
            WHERE 
                IsDeleted = 0
            GROUP BY ClienteId
        ),
        Clients AS (
            SELECT 
                c.Id AS ClientId,
                cb.Razao AS ClientName,
                cb.Email AS Email,
                uo.LastDate,
                DATEDIFF(DAY, uo.LastDate, GETDATE()) AS InactiveDays,
                (SELECT SUM(o2.ValorCompra) 
                 FROM dbo.Operacao o2
                 WHERE o2.ClienteId = c.Id
                   AND o2.IsDeleted = 0
                ) AS HistoricalVolume,
                a.Id AS AgentId,
                cba.Razao AS AgentFullName
            FROM dbo.Cliente c
            INNER JOIN LastOperation uo ON c.Id = uo.ClienteId
            INNER JOIN dbo.CadastroBase cb ON c.CadastroBaseId = cb.Id
            LEFT JOIN dbo.Agente a ON c.AgenteId = a.Id
            LEFT JOIN dbo.CadastroBase cba ON a.CadastroBaseId = cba.Id
            WHERE 
                cb.IsDeleted = 0
        )
        SELECT 
            COUNT(*) OVER() AS TotalCount,
            ClientName,
            Email,
            LastDate,
            InactiveDays,
            HistoricalVolume,
            LEFT(AgentFullName, CHARINDEX(' ', AgentFullName + ' ') - 1) AS AgentName
        FROM Clients
        WHERE {risk_condition}
        ORDER BY {sort_column} {sort_direction}
        OFFSET {offset} ROWS FETCH NEXT {items_per_page} ROWS ONLY;
        """

        db = Database()
        try:
            results = db.execute_query(query)
            churn_data = []
            total_count = 0
            for row in results:
                total_count = row[0]
                client_name, email, last_date, inactive_days, historical_volume, agent_name = row[1:]
                first_email = email.split(';')[0].strip().lower()

                if inactive_days > 120:
                    risk = "Consumado"
                elif inactive_days > 90:
                    risk = "Alto"
                elif inactive_days > 60:
                    risk = "Médio"
                elif inactive_days > 30:
                    risk = "Baixo"
                else:
                    risk = "-"
                churn_data.append({
                    "client": client_name,
                    "email": first_email,
                    "last_operation": last_date,
                    "inactive_days": inactive_days,
                    "historical_volume": f"{historical_volume:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                    "agent": agent_name.capitalize(),
                    "risk": risk
                })
            return {"data": churn_data, "total_count": total_count}
        except Exception as e:
            print(f"Erro ao executar a query no banco de dados: {e}")
            raise RuntimeError(f"Erro ao buscar dados de churn: {e}")
        finally:
            db.close_connection()
