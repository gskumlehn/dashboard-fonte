from typing import Dict, Any, List
from app.infra.db_connection import Database
from app.utils.date_utils import DateUtils

class DefaultRateService:
    def get_daily_rate_series(self, start_date: str, end_date: str) -> Dict[str, Any]:
        start_dt = DateUtils.parse_date(start_date)
        end_dt = DateUtils.parse_date(end_date)

        start_str = start_dt.strftime('%Y-%m-%d')
        end_str = end_dt.strftime('%Y-%m-%d')

        db = Database()
        try:
            sql = f"""
            WITH DateSeries AS (
                SELECT CAST('{start_str}' AS DATE) AS analysis_date
                UNION ALL
                SELECT DATEADD(DAY, 1, analysis_date)
                FROM DateSeries
                WHERE analysis_date < CAST('{end_str}' AS DATE)
            ),
            DocumentosAjustados AS (
                SELECT 
                    d.Id as document_id,
                    d.Numero as document_number,
                    d.DataVencimento as original_due_date,
                    d.DataBaixa as payment_date,
                    d.Valor as document_value,
                    d.Status as document_status,
                    dbo.fn_DataVencimentoAjustada(d.DataVencimento, NULL, NULL) as adjusted_due_date,
                    DATEADD(DAY, 1, dbo.fn_DataVencimentoAjustada(d.DataVencimento, NULL, NULL)) as overdue_start_date,
                    CASE 
                        WHEN d.DataBaixa IS NOT NULL THEN DATEADD(DAY, -1, d.DataBaixa)
                        ELSE CAST(GETDATE() AS DATE)
                    END as overdue_end_date
                FROM Documento d
                WHERE d.IsDeleted = 0
                  AND d.DataVencimento IS NOT NULL
                  AND d.DataVencimento <= CAST('{end_str}' AS DATE)
                  AND (d.DataBaixa IS NULL OR d.DataBaixa >= CAST('{start_str}' AS DATE))
            ),
            DocumentosVencidosPorDia AS (
                SELECT 
                    ds.analysis_date,
                    da.document_id,
                    da.document_value,
                    da.original_due_date,
                    da.adjusted_due_date,
                    da.payment_date,
                    da.overdue_start_date,
                    da.overdue_end_date,
                    CASE 
                        WHEN ds.analysis_date >= da.overdue_start_date 
                         AND ds.analysis_date <= da.overdue_end_date
                        THEN 1
                        ELSE 0
                    END as is_overdue_on_date
                FROM DateSeries ds
                CROSS JOIN DocumentosAjustados da
                WHERE ds.analysis_date >= da.overdue_start_date
                  AND ds.analysis_date <= da.overdue_end_date
            ),
            DocumentosAtivosPorDia AS (
                SELECT 
                    ds.analysis_date,
                    COUNT(DISTINCT d.Id) as total_active_documents,
                    SUM(d.Valor) as total_active_value
                FROM DateSeries ds
                CROSS JOIN Documento d
                WHERE d.IsDeleted = 0
                  AND d.DataEmissao <= ds.analysis_date
                  AND (
                      d.DataBaixa IS NULL 
                      OR d.DataBaixa > ds.analysis_date
                  )
                GROUP BY ds.analysis_date
            )
            SELECT 
                dvpd.analysis_date,
                COUNT(DISTINCT CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_id END) as overdue_documents,
                dapd.total_active_documents,
                SUM(CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_value ELSE 0 END) as overdue_value,
                dapd.total_active_value,
                CASE 
                    WHEN dapd.total_active_documents > 0 THEN
                        CAST(COUNT(DISTINCT CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_id END) AS FLOAT) * 100.0 
                        / dapd.total_active_documents
                    ELSE 0
                END as default_rate_percent,
                CASE 
                    WHEN dapd.total_active_value > 0 THEN
                        SUM(CASE WHEN dvpd.is_overdue_on_date = 1 THEN dvpd.document_value ELSE 0 END) * 100.0 
                        / dapd.total_active_value
                    ELSE 0
                END as default_rate_value_percent
            FROM DocumentosVencidosPorDia dvpd
            INNER JOIN DocumentosAtivosPorDia dapd ON dvpd.analysis_date = dapd.analysis_date
            GROUP BY dvpd.analysis_date, dapd.total_active_documents, dapd.total_active_value
            ORDER BY dvpd.analysis_date
            OPTION (MAXRECURSION 0);
            """
            rows = db.execute_query(sql)
            result: List[Dict[str, Any]] = []
            for r in rows:
                analysis_date = r[0]
                rate = float(r[5] or 0)
                date_obj = DateUtils.create_brazilian_date_without_altering(analysis_date)
                result.append({
                    "date": date_obj,
                    "rate": rate
                })
            return {"data": result}
        finally:
            db.close_connection()

    def get_monthly_rate_series(self, start_date: str, end_date: str) -> Dict[str, Any]:
        start_dt = DateUtils.parse_date(start_date)
        end_dt = DateUtils.parse_date(end_date)

        start_str = start_dt.strftime('%Y-%m-%d')
        end_str = end_dt.strftime('%Y-%m-%d')

        db = Database()
        try:
            sql = f"""
            WITH MonthlyAggregatedData AS (
                SELECT 
                    FORMAT(DataVencimento, 'yyyy-MM') AS period,
                    SUM(Valor) AS overdue_value_placeholder
                FROM Documento d
                WHERE 
                    d.IsDeleted = 0
                    AND d.DataVencimento IS NOT NULL
                    AND CAST(d.DataVencimento AS DATE) BETWEEN '{start_str}' AND '{end_str}'
                GROUP BY FORMAT(DataVencimento, 'yyyy-MM')
            )
            SELECT 
                period,
                0 AS overdue_count,
                0 AS total_count,
                0.0 AS default_rate_percent
            FROM MonthlyAggregatedData
            ORDER BY period ASC;
            """
            rows = db.execute_query(sql)
            result: List[Dict[str, Any]] = []
            for r in rows:
                period_raw = r[0]
                date_obj = DateUtils.create_brazilian_date_without_altering(period_raw)
                rate = float(r[3] or 0.0)
                result.append({
                    "date": date_obj,
                    "rate": rate
                })
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
                overdue_value = round(float(result[2] or 0), 2)
                open_value = round(float(result[3] or 0), 2)

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
