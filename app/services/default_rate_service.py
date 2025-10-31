from typing import Dict, Any
from app.infra.db_connection import Database
from app.utils.date_utils import DateUtils
import logging

# Configurar logging
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

class DefaultRateService:
    def get_daily_default_rate(self, start_date: str, end_date: str) -> Dict[str, Any]:
        try:
            # Parse dates
            start_date_obj = DateUtils.parse_date(start_date)
            end_date_obj = DateUtils.parse_date(end_date)

            # Convert back to string in 'yyyy-MM-dd' format
            start_date_str = start_date_obj.strftime('%Y-%m-%d')
            end_date_str = end_date_obj.strftime('%Y-%m-%d')

            sql = f"""
            WITH Calendar AS (
                SELECT 
                    DATEADD(DAY, n, '{start_date}') AS Date,
                    DATEPART(WEEKDAY, DATEADD(DAY, n, '{start_date}')) AS WeekDay,
                    CASE 
                        WHEN DATEPART(WEEKDAY, DATEADD(DAY, n, '{start_date}')) IN (1, 7) THEN 1
                        ELSE 0
                    END AS IsWeekend
                FROM (
                    SELECT TOP (DATEDIFF(DAY, '{start_date}', '{end_date}') + 1)
                        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 AS n
                    FROM sys.all_objects
                ) AS Numbers
            ),
            AdjustedDueDocuments AS (
                SELECT 
                    d.Id,
                    d.OperacaoId,
                    d.ValorFace,
                    d.DataVencimento AS OriginalDueDate,
                    CASE 
                        WHEN DATEPART(WEEKDAY, d.DataVencimento) = 7 THEN  
                            DATEADD(DAY, 2, d.DataVencimento) -- Sábado para segunda-feira
                        WHEN DATEPART(WEEKDAY, d.DataVencimento) = 1 THEN  
                            DATEADD(DAY, 1, d.DataVencimento) -- Domingo para segunda-feira
                        ELSE 
                            d.DataVencimento
                    END AS AdjustedDueDate,
                    d.DataBaixa AS SettlementDate,
                    d.DataEmissao AS IssueDate
                FROM dbo.Documento d
                INNER JOIN dbo.Operacao o ON d.OperacaoId = o.Id
                WHERE 
                    d.IsDeleted = 0
                    AND o.IsDeleted = 0
                    AND d.DataEmissao <= '{end_date}'
                    AND (d.DataBaixa IS NULL OR d.DataBaixa >= '{start_date}')
            ),
            DailyActivePortfolio AS (
                SELECT 
                    c.Date,
                    SUM(d.ValorFace) AS TotalPortfolioValue,
                    COUNT(d.Id) AS DocumentCount
                FROM Calendar c
                CROSS APPLY (
                    SELECT d.Id, d.ValorFace
                    FROM AdjustedDueDocuments d
                    WHERE 
                        d.DataEmissao <= c.Date
                        AND (d.DataBaixa IS NULL OR d.DataBaixa > c.Date)
                ) d
                WHERE c.IsWeekend = 0 -- Ignorar finais de semana
                GROUP BY c.Date
            ),
            DailyDefaultedDocuments AS (
                SELECT 
                    c.Date,
                    SUM(d.ValorFace) AS DefaultValue,
                    COUNT(d.Id) AS DefaultDocumentCount,
                    AVG(DATEDIFF(DAY, d.AdjustedDueDate, c.Date)) AS AverageDelayDays
                FROM Calendar c
                CROSS APPLY (
                    SELECT 
                        d.Id, 
                        d.ValorFace,
                        d.AdjustedDueDate
                    FROM AdjustedDueDocuments d
                    WHERE 
                        d.AdjustedDueDate < c.Date
                        AND (d.DataBaixa IS NULL OR d.DataBaixa > c.Date)
                ) d
                WHERE c.IsWeekend = 0 -- Ignorar finais de semana
                GROUP BY c.Date
            )
            SELECT 
                dap.Date,
                dap.TotalPortfolioValue,
                dap.DocumentCount,
                ISNULL(ddd.DefaultValue, 0) AS DefaultValue,
                ISNULL(ddd.DefaultDocumentCount, 0) AS DefaultDocumentCount,
                ROUND(
                    CASE 
                        WHEN dap.TotalPortfolioValue > 0 THEN 
                            (ISNULL(ddd.DefaultValue, 0) / dap.TotalPortfolioValue) * 100
                        ELSE 0
                    END,
                    2
                ) AS DefaultRate,
                ROUND(ISNULL(ddd.AverageDelayDays, 0), 0) AS AverageDelayDays
            FROM DailyActivePortfolio dap
            LEFT JOIN DailyDefaultedDocuments ddd ON dap.Date = ddd.Date
            ORDER BY dap.Date;
            """

            db = Database()
            rows = db.execute_query(sql)
            result = [
                {
                    "date": r[0],
                    "total_portfolio_value": round(float(r[1]), 2),
                    "total_documents": r[2],
                    "default_value": round(float(r[3]), 2),
                    "default_documents": r[4],
                    "default_rate": round(float(r[5]), 2),
                    "average_delay_days": r[6],
                }
                for r in rows
            ]
            return {"data": result}
        except Exception as e:
            logger.error(f"Error executing query: {str(e)}", exc_info=True)
            raise
        finally:
            db.close_connection()
