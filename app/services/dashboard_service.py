from typing import Dict, Any
from app.infra.db_connection import Database
from app.utils.date_utils import DateUtils

class DashboardService:

    def get_monthly_volume_data(self, start_date: str, end_date: str) -> Dict[str, Any]:
        start_date_obj = DateUtils.get_start_of_month(DateUtils.parse_date(start_date))
        end_date_obj = DateUtils.get_end_of_month(DateUtils.parse_date(end_date))

        start_date_str = start_date_obj.strftime('%Y-%m-%d')
        end_date_str = end_date_obj.strftime('%Y-%m-%d')

        sql = f"""
        WITH MonthlyAggregatedData AS (
            SELECT 
                FORMAT(Data, 'yyyy-MM') AS period,
                SUM(ValorCompra) AS total_volume
            FROM dbo.Operacao
            WHERE 
                IsDeleted = 0
                AND Data >= '{start_date_str}' AND Data <= '{end_date_str}'
            GROUP BY FORMAT(Data, 'yyyy-MM')
        )
        SELECT 
            period AS period_date,
            ISNULL(total_volume, 0) AS total_volume
        FROM MonthlyAggregatedData
        ORDER BY period ASC;
        """

        db = Database()
        try:
            rows = db.execute_query(sql)
            result = [{"date": r[0], "total_volume": round(float(r[1]), 2)} for r in rows]
            return {"data": result}
        finally:
            db.close_connection()
