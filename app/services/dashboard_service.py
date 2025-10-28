from typing import Tuple, Dict, Any, Optional
from app.services.comercial_service import ComercialService
from app.infra.db_connection import Database

class DashboardService:
    def __init__(self, comercial_service: ComercialService = None):
        self.comercial = comercial_service or ComercialService()

    def build_volume_query(self, period: str = "month",
                           start_date: Optional[str] = None,
                           end_date: Optional[str] = None) -> Tuple[str, Dict[str, Any]]:
        """
        Build base query for operation volume by period.
        Supported period values (strings):
          - 'all'             : todo o período (retorna uma linha agregada)
          - 'year'            : agregado por ano
          - 'year_month'      : ano agregado por mês (yyyy-MM)
          - 'quarter_week'    : trimestre agregado por semana (YYYY-Qn-Ww)
          - 'month_day'       : mês agregado por dia (data)
          - 'month' (default) : formato yyyy-MM (mês)
          - 'day'             : agregado por dia
        """
        p = (period or "month").lower()

        if p == "all":
            agg_field = "1"
            period_format_expr = "'Todo o Período'"
        elif p == "day":
            agg_field = "CAST(Data AS DATE)"
            period_format_expr = "CONVERT(varchar(10), Period, 23)"
        elif p == "year":
            agg_field = "YEAR(Data)"
            period_format_expr = "CAST(Period AS VARCHAR(4))"
        elif p == "year_month":
            agg_field = "FORMAT(Data, 'yyyy-MM')"
            period_format_expr = "Periodo"
        elif p == "quarter_week":
            # CONCAT YEAR, QUARTER and WEEK to represent week inside quarter/year
            agg_field = "CONCAT(YEAR(Data), '-Q', DATEPART(QUARTER, Data), '-W', DATEPART(WEEK, Data))"
            period_format_expr = "Periodo"
        elif p == "month_day":
            agg_field = "CAST(Data AS DATE)"
            period_format_expr = "CONVERT(varchar(10), Period, 23)"
        else:  # default to month
            agg_field = "FORMAT(Data, 'yyyy-MM')"
            period_format_expr = "Periodo"

        # Build period filter
        filters = []
        params: Dict[str, Any] = {}
        if start_date:
            filters.append("Data >= @start_date")
            params["start_date"] = start_date
        if end_date:
            filters.append("Data <= @end_date")
            params["end_date"] = end_date
        period_filter = " AND ".join(filters) if filters else "1=1"

        sql = f"""
        WITH ValidOperations AS (
            SELECT 
                Data,
                ValorCompra
            FROM dbo.Operacao
            WHERE 
                IsDeleted = 0
                AND {period_filter}
        ),
        AggregatedData AS (
            SELECT 
                {agg_field} AS Period,
                SUM(ValorCompra) AS TotalVolume,
                COUNT(*) AS OperationCount
            FROM ValidOperations
            GROUP BY {agg_field}
        )
        SELECT 
            Period,
            {period_format_expr} AS PeriodFormatted,
            TotalVolume,
            OperationCount
        FROM AggregatedData
        ORDER BY Period ASC;
        """
        return sql, params

    def get_volume_data(self, period: str = "month",
                        start_date: Optional[str] = None,
                        end_date: Optional[str] = None):
        """
        Build and execute the volume query and return processed results as list of dicts.
        Returns: {"data": [...], "sql": "..."} where data items are:
            { period, period_formatted, total_volume, operation_count }
        """
        sql, params = self.build_volume_query(period, start_date, end_date)
        db = Database()
        try:
            try:
                rows = db.execute_query(sql, params)
            except TypeError:
                rows = db.execute_query(sql)

            result = []
            for r in rows:
                result.append({
                    "period": r[0],
                    "period_formatted": r[1],
                    "total_volume": r[2],
                    "operation_count": r[3]
                })
            return {"data": result, "sql": sql}
        except Exception as e:
            raise RuntimeError(f"Error fetching volume data: {e}")
        finally:
            db.close_connection()
