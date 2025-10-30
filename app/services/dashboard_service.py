from typing import Tuple, Dict, Any, Optional
from app.services.comercial_service import ComercialService
from app.infra.db_connection import Database
import re

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
          - 'quarter_week'    : trimestre agregado por semana (YYYY-MM-Ww)
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
            period_format_expr = "Period"
        elif p == "quarter_week":
            # include month so frontend can compute week-of-month: 'YYYY-MM-Ww'
            agg_field = "CONCAT(YEAR(Data), '-', FORMAT(Data, 'MM'), '-W', DATEPART(WEEK, Data))"
            period_format_expr = "Period"
        elif p == "month_day":
            agg_field = "CAST(Data AS DATE)"
            period_format_expr = "CONVERT(varchar(10), Period, 23)"
        else:  # default to month
            agg_field = "FORMAT(Data, 'yyyy-MM')"
            period_format_expr = "Period"

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
            ISNULL(TotalVolume, 0) AS TotalVolume, -- Garantir que TotalVolume nunca seja NULL
            OperationCount
        FROM AggregatedData
        ORDER BY Period ASC;
        """
        return sql, params

    # --- helpers for safe rendering when DB driver doesn't accept params ---
    def _escape_sql_literal(self, value: Any) -> str:
        """
        Escapes a simple scalar value to be safely injected as SQL literal.
        Currently supports strings and numbers; wraps strings in single quotes and escapes internal quotes.
        """
        if value is None:
            return 'NULL'
        if isinstance(value, (int, float)):
            return str(value)
        s = str(value)
        s = s.replace("'", "''")
        return f"'{s}'"

    def _render_sql_with_params(self, sql: str, params: Dict[str, Any]) -> str:
        """
        Replace named parameters like @start_date/@end_date in the SQL with escaped literals.
        Simple textual replacement is used because params are dates/strings produced by UI.
        """
        rendered = sql
        # Replace @paramName with escaped literal for known params
        for k, v in params.items():
            placeholder = f"@{k}"
            escaped = self._escape_sql_literal(v)
            # use regex word-boundary replace to avoid accidental partial matches
            rendered = re.sub(re.escape(placeholder) + r'\b', escaped, rendered)
        return rendered

    # Novo helper para printar resumo das linhas retornadas
    def _debug_print_rows_summary(self, rows):
        """
        Imprime um resumo das linhas retornadas:
        - total de linhas
        - primeiras 5 linhas (repr)
        - tipos/formatos dos campos da primeira linha (útil para verificar se period vem como date/string/numero)
        """
        try:
            if rows is None:
                print("[DEBUG] rows is None")
                return
            length = len(rows)
            print(f"[DEBUG] rows count: {length}")
            sample = rows[:5]
            print(f"[DEBUG] sample rows (até 5):")
            for i, r in enumerate(sample):
                print(f"  [{i}] {repr(r)}")
            if length > 0:
                first = rows[0]
                # Se row for tupla/list ou dict, printar detalhes de cada coluna
                if isinstance(first, (list, tuple)):
                    col_types = [type(c).__name__ + ':' + repr(c)[:100] for c in first]
                    print(f"[DEBUG] first row column types/preview: {col_types}")
                elif isinstance(first, dict):
                    col_types = {k: type(v).__name__ for k, v in first.items()}
                    print(f"[DEBUG] first row keys/types: {col_types}")
                else:
                    print(f"[DEBUG] first row type: {type(first).__name__} value: {repr(first)[:200]}")
        except Exception as e:
            print(f"[DEBUG] erro ao imprimir resumo das rows: {e}")

    def get_volume_data(self, period: str = "month",
                        start_date: Optional[str] = None,
                        end_date: Optional[str] = None):
        """
        Build and execute the volume query and return processed results as list of dicts.
        Returns: {"data": [...], "sql": "..."} where data items are:
            { period, period_formatted, total_volume, operation_count }
        """
        sql, params = self.build_volume_query(period, start_date, end_date)
        # Debug: mostrar SQL gerado e params antes da execução
        print("[DEBUG] Executando get_volume_data")
        print(f"[DEBUG] built SQL (truncated): {sql.strip()[:1000]}")  # trunca para evitar flood
        print(f"[DEBUG] params: {params}")
        db = Database()
        try:
            rows = None
            # Try preferred execution with params (if Database supports it)
            try:
                if params:
                    print("[DEBUG] Tentando executar query com parâmetros (db.execute_query(sql, params))")
                    rows = db.execute_query(sql, params)
                else:
                    print("[DEBUG] Executando query sem parâmetros (db.execute_query(sql))")
                    rows = db.execute_query(sql)
                # Debug: mostrar resumo das rows retornadas pela primeira tentativa
                print("[DEBUG] Resultado da execução inicial:")
                self._debug_print_rows_summary(rows)
            except Exception as exec_err:
                # Fallback: render SQL with literals if driver rejects params (common with some ODBC wrappers)
                print(f"[DEBUG] exceção ao executar com params: {repr(exec_err)}")
                msg = str(exec_err)
                if params and ("parameter markers" in msg or "0 parameter" in msg or "HY000" in msg or "42S22" in msg):
                    rendered_sql = self._render_sql_with_params(sql, params)
                    print("[DEBUG] Usando fallback: SQL renderizado com literais (truncated):")
                    print(f"  {rendered_sql.strip()[:1000]}")
                    rows = db.execute_query(rendered_sql)
                    print("[DEBUG] Resultado após fallback (executando SQL renderizado):")
                    self._debug_print_rows_summary(rows)
                else:
                    # re-raise original error if it's not the params-mismatch
                    raise

            result = []
            for r in rows:
                result.append({
                    "period": r[0],
                    "period_formatted": r[1],
                    "total_volume": r[2],
                    "operation_count": r[3]
                })
            # Debug: mostrar resultado final antes de retornar
            print("[DEBUG] Resultado final (após conversão para dicts) - sample até 5 items:")
            for i, item in enumerate(result[:5]):
                print(f"  [{i}] {item}")
            return {"data": result, "sql": sql}
        except Exception as e:
            # Imprimir erro completo para diagnóstico antes de propagar
            print(f"[ERROR] Error fetching volume data: {repr(e)}")
            raise RuntimeError(f"Error fetching volume data: {e}")
        finally:
            db.close_connection()
