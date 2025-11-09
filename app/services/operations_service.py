from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from app.infra.db_connection import Database
from app.utils.date_utils import DateUtils

class OperationsService:
    def get_monthly_volume_data(self, start_date: str, end_date: str) -> Dict[str, Any]:
        start_date_obj = DateUtils.get_start_of_month(DateUtils.parse_date(start_date))
        end_date_obj = DateUtils.get_end_of_month(DateUtils.parse_date(end_date))

        start_date_str = start_date_obj.strftime('%Y-%m-%d')
        end_date_str = end_date_obj.strftime('%Y-%m-%d')

        sql = f"""
        WITH MonthlyAggregatedData AS (
            SELECT 
                FORMAT(Data, 'yyyy-MM') AS period,
                SUM(ValorCompra) AS total_volume,
                AVG(ValorCompra) AS average_ticket
            FROM dbo.Operacao
            WHERE 
                IsDeleted = 0
                AND Data >= '{start_date_str}' AND Data <= '{end_date_str}'
            GROUP BY FORMAT(Data, 'yyyy-MM')
        )
        SELECT 
            period AS period_date,
            ISNULL(total_volume, 0) AS total_volume,
            ISNULL(average_ticket, 0) AS average_ticket
        FROM MonthlyAggregatedData
        ORDER BY period ASC;
        """

        db = Database()
        try:
            rows = db.execute_query(sql)
            result = [
                {
                    "date": DateUtils.create_brazilian_date_without_altering(r[0]).strftime('%Y-%m-%d'),
                    "total_volume": round(float(r[1]), 2),
                    "average_ticket": round(float(r[2]), 2)
                }
                for r in rows
            ]
            return {"data": result}
        finally:
            db.close_connection()

    def get_daily_volume_data(self, start_date: str, end_date: str) -> Dict[str, Any]:
        start_date_obj = DateUtils.parse_date(start_date)
        end_date_obj = DateUtils.parse_date(end_date)

        start_date_str = start_date_obj.strftime('%Y-%m-%d')
        end_date_str = end_date_obj.strftime('%Y-%m-%d')

        sql = f"""
        WITH DailyAggregatedData AS (
            SELECT 
                CAST(Data AS DATE) AS period,
                SUM(ValorCompra) AS total_volume,
                AVG(ValorCompra) AS average_ticket
            FROM dbo.Operacao
            WHERE 
                IsDeleted = 0
                AND Data >= '{start_date_str}' AND Data <= '{end_date_str}'
                AND DATEPART(WEEKDAY, Data) NOT IN (1, 7)
            GROUP BY CAST(Data AS DATE)
        )
        SELECT 
            period AS period_date,
            ISNULL(total_volume, 0) AS total_volume,
            ISNULL(average_ticket, 0) AS average_ticket
        FROM DailyAggregatedData
        ORDER BY period ASC;
        """

        db = Database()
        try:
            rows = db.execute_query(sql)
            result = [
                {
                    "date": DateUtils.create_brazilian_date_without_altering(r[0]).strftime('%Y-%m-%d'),
                    "total_volume": round(float(r[1]), 2),
                    "average_ticket": round(float(r[2]), 2)
                }
                for r in rows
            ]
            return {"data": result}
        finally:
            db.close_connection()

    def get_current_default_rate(self) -> Dict[str, Any]:
        sql = """
            SELECT 
                COUNT(DISTINCT CASE WHEN is_overdue = 1 THEN d.Id END) as overdue_documents,
                COUNT(DISTINCT d.Id) as open_documents,
                SUM(CASE WHEN is_overdue = 1 THEN d.ValorFace ELSE 0 END) as overdue_value,
                SUM(d.ValorFace) as open_value
            FROM (
                SELECT 
                    d.Id,
                    d.ValorFace,
                    CASE 
                        WHEN d.Status = 0
                         AND CAST(GETDATE() AS DATE) > 
                             (CASE 
                                WHEN DATEPART(WEEKDAY, CAST(d.DataVencimento AS DATE)) = 7 
                                    THEN DATEADD(DAY, 2, CAST(d.DataVencimento AS DATE))
                                WHEN DATEPART(WEEKDAY, CAST(d.DataVencimento AS DATE)) = 1 
                                    THEN DATEADD(DAY, 1, CAST(d.DataVencimento AS DATE))
                                ELSE CAST(d.DataVencimento AS DATE)
                              END)
                        THEN 1
                        ELSE 0
                    END as is_overdue
                FROM Documento d
                WHERE d.IsDeleted = 0
                  AND d.Status = 0
                  AND d.DataVencimento IS NOT NULL
            ) d
        """

        db = Database()
        try:
            rows = db.execute_query(sql)
            if rows:
                result = rows[0]
                overdue_documents = result[0]
                open_documents = result[1]
                overdue_value = round(float(result[2]), 2)
                open_value = round(float(result[3]), 2)

                default_rate_percent = round((overdue_documents / open_documents) * 100, 2) if open_documents > 0 else 0
                default_rate_value_percent = round((overdue_value / open_value) * 100, 2) if open_value > 0 else 0

                return {
                    "overdue_documents": overdue_documents,
                    "open_documents": open_documents,
                    "overdue_value": overdue_value,
                    "open_value": open_value,
                    "default_rate_percent": default_rate_percent,
                    "default_rate_value_percent": default_rate_value_percent,
                }
            return {}
        finally:
            db.close_connection()
