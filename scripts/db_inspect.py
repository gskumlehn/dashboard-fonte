import json
from app.infra.db_connection import Database
from dotenv import load_dotenv

def exec_query(conn, sql, params=None):
    cur = conn.cursor()
    try:
        if params:
            cur.execute(sql, params)
        else:
            cur.execute(sql)
        return cur.fetchall()
    finally:
        cur.close()

def list_tables(conn):
    sql = """
    SELECT s.name AS schema_name, t.name AS table_name
    FROM sys.tables t
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    ORDER BY s.name, t.name
    """
    rows = exec_query(conn, sql)
    return [{"schema": r[0], "table": r[1]} for r in rows]

def get_columns(conn, schema, table):
    sql = f"""
    SELECT c.name, tp.name, c.max_length, c.precision, c.scale, c.is_nullable, c.is_identity
    FROM sys.columns c
    JOIN sys.types tp ON c.user_type_id = tp.user_type_id
    WHERE c.object_id = OBJECT_ID('{schema}.{table}')
    ORDER BY c.column_id
    """
    rows = exec_query(conn, sql)
    cols = []
    for name, dtype, max_len, prec, scale, is_nullable, is_identity in rows:
        cols.append({
            "name": name,
            "data_type": dtype,
            "max_length": max_len,
            "precision": prec,
            "scale": scale,
            "is_nullable": bool(is_nullable),
            "is_identity": bool(is_identity),
        })
    return cols

def get_primary_keys(conn, schema, table):
    sql = f"""
    SELECT kcu.COLUMN_NAME
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
    JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
      ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
      AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
    WHERE tc.TABLE_SCHEMA = ? AND tc.TABLE_NAME = ? AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
    ORDER BY kcu.ORDINAL_POSITION
    """
    rows = exec_query(conn, sql, (schema, table))
    return [r[0] for r in rows]

def get_foreign_keys(conn):
    sql = """
    SELECT
      fk.name AS fk_name,
      sch_src.name AS src_schema,
      parent.name AS src_table,
      col_src.name AS src_column,
      sch_ref.name AS ref_schema,
      ref.name AS ref_table,
      col_ref.name AS ref_column
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.tables parent ON fkc.parent_object_id = parent.object_id
    JOIN sys.schemas sch_src ON parent.schema_id = sch_src.schema_id
    JOIN sys.columns col_src ON fkc.parent_object_id = col_src.object_id AND fkc.parent_column_id = col_src.column_id
    JOIN sys.tables ref ON fkc.referenced_object_id = ref.object_id
    JOIN sys.schemas sch_ref ON ref.schema_id = sch_ref.schema_id
    JOIN sys.columns col_ref ON fkc.referenced_object_id = col_ref.object_id AND fkc.referenced_column_id = col_ref.column_id
    ORDER BY fk.name
    """
    rows = exec_query(conn, sql)
    fks = []
    for fk_name, src_schema, src_table, src_col, ref_schema, ref_table, ref_col in rows:
        fks.append({
            "fk_name": fk_name,
            "src_schema": src_schema,
            "src_table": src_table,
            "src_column": src_col,
            "ref_schema": ref_schema,
            "ref_table": ref_table,
            "ref_column": ref_col,
        })
    return fks

def build_metadata(conn):
    sql = "SELECT name FROM sys.databases WHERE name = 'livework_fonte';"
    if not exec_query(conn, sql):
        raise Exception("Database 'livework_fonte' does not exist or is not accessible.")

    tables = list_tables(conn)
    metadata = {"database": "livework_fonte", "tables": {}, "foreign_keys": []}
    for t in tables:
        schema = t["schema"]
        table = t["table"]
        cols = get_columns(conn, schema, table)
        pks = get_primary_keys(conn, schema, table)
        metadata["tables"][f"{schema}.{table}"] = {"schema": schema, "table": table, "columns": cols, "primary_keys": pks}
    metadata["foreign_keys"] = get_foreign_keys(conn)
    return metadata

def generate_dot(metadata, out_path="schema.dot"):
    lines = ["digraph schema {", "  rankdir=LR;", "  node [shape=plaintext];"]
    for full, info in metadata["tables"].items():
        label_lines = [f"<{full}>", "<table border='1' cellborder='1' cellspacing='0'>",
                       f"<tr><td bgcolor='lightgray' colspan='2'><b>{info['schema']}.{info['table']}</b></td></tr>"]
        for col in info["columns"]:
            col_name = col["name"]
            dtype = col["data_type"]
            pk_mark = " (PK)" if col_name in info["primary_keys"] else ""
            label_lines.append(f"<tr><td align='left'>{col_name}{pk_mark}</td><td align='left'>{dtype}</td></tr>")
        label_lines.append("</table>")
        label = "".join(label_lines)
        lines.append(f'  "{full}" [label=< {label} >];')

    for fk in metadata["foreign_keys"]:
        src = f"{fk['src_schema']}.{fk['src_table']}"
        ref = f"{fk['ref_schema']}.{fk['ref_table']}"
        label = fk["fk_name"]
        lines.append(f'  "{src}" -> "{ref}" [label="{label}"];')

    lines.append("}")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

def main():
    load_dotenv()

    db = Database()
    db.connect()
    try:
        conn = db.get_connection()
        metadata = build_metadata(conn)
        with open("schema.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        generate_dot(metadata, "schema.dot")
        print("Metadados salvos em schema.json e diagrama em schema.dot (use Graphviz para renderizar).")
    finally:
        db.close_connection()

if __name__ == "__main__":
    main()
