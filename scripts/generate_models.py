import json
import os

OUTPUT_DIR = "/Users/gabriel.kumlehn/PycharmProjects/dashboard-fonte/app/models"

TABLES_TO_GENERATE = [
    "dbo.Operacao",
    "dbo.Documento",
    "dbo.Cliente",
    "dbo.Sacado",
    "dbo.CadastroBase",
    "dbo.PagarReceber",
    "dbo.CaixaBanco",
    "dbo.Comissao",
]

def snake_case(name):
    return ''.join(['_' + i.lower() if i.isupper() else i for i in name]).lstrip('_')

def map_sql_type_to_sqlalchemy(sql_type):
    if sql_type in ["int", "bigint", "smallint", "tinyint"]:
        return "Integer"
    elif sql_type in ["varchar", "nvarchar", "text", "uniqueidentifier"]:
        return "String"
    elif sql_type in ["float", "decimal", "money"]:
        return "Float"
    elif sql_type in ["bit"]:
        return "Boolean"
    elif sql_type in ["date", "smalldatetime", "timestamp"]:
        return "String"  # Pode ser ajustado para DateTime se necessário
    else:
        return "String"

def generate_model(table_name, table_data):
    schema, table = table_name.split(".")
    class_name = table
    columns = table_data["columns"]
    primary_keys = table_data["primary_keys"]

    lines = [f"from sqlalchemy import Column, Integer, String, Boolean, Float\n"
             f"from sqlalchemy.ext.declarative import declarative_base\n\n"
             f"Base = declarative_base()\n\n"
             f"class {class_name}(Base):",
             f"    __tablename__ = '{snake_case(table)}'",
             f"    __table_args__ = {{'schema': '{schema}'}}"]

    for column in columns:
        col_name = column["name"]
        col_type = map_sql_type_to_sqlalchemy(column["data_type"])
        is_primary = col_name in primary_keys
        is_nullable = column["is_nullable"]

        col_line = f"    {snake_case(col_name)} = Column({col_type}, "
        if is_primary:
            col_line += "primary_key=True, "
        if not is_nullable:
            col_line += "nullable=False, "
        col_line += ")"
        lines.append(col_line)

    return "\n".join(lines)

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    with open("../schemas/schema.json", "r", encoding="utf-8") as f:
        schema = json.load(f)

    for table_name in TABLES_TO_GENERATE:
        table_key = next((key for key in schema["tables"] if key == table_name), None)
        if not table_key:
            print(f"Tabela {table_name} não encontrada no schema.json.")
            continue

        table_data = schema["tables"][table_key]
        model_code = generate_model(table_name, table_data)

        output_file = os.path.join(OUTPUT_DIR, f"{snake_case(table_name.split('.')[-1])}.py")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(model_code)
        print(f"Modelo gerado: {output_file}")

if __name__ == "__main__":
    main()
