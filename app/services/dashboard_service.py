from typing import Dict, Any, Optional
from app.infra.db_connection import Database

class DashboardService:

    def get_monthly_volume_data(self, start_date: str, end_date: str) -> Dict[str, Any]:
        sql = """
        WITH MonthlyAggregatedData AS (
            SELECT 
                FORMAT(Data, 'yyyy-MM') AS Period,
                SUM(ValorCompra) AS TotalVolume
            FROM dbo.Operacao
            WHERE 
                IsDeleted = 0
                AND Data >= @start_date AND Data <= @end_date
            GROUP BY FORMAT(Data, 'yyyy-MM')
        )
        SELECT 
            Period AS Date,
            ISNULL(TotalVolume, 0) AS TotalVolume
        FROM MonthlyAggregatedData
        ORDER BY Period ASC;
        """
        params = {"start_date": start_date, "end_date": end_date}

        db = Database()
        try:
            rows = db.execute_query(sql, params)
            result = [{"date": r[0], "total_volume": r[1]} for r in rows]
            return {"data": result}
        finally:
            db.close_connection()
