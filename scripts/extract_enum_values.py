import json
import sys
import os
from datetime import datetime
from pathlib import Path

from app.infra.db_connection import Database
from dotenv import load_dotenv


def load_enum_candidates():
    enum_file = 'scripts/enum_candidates.json'
    with open(enum_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def extract_enum_values(db, table_name, column_name, data_type):
    check_isdeleted_query = f"""
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' 
        AND TABLE_NAME = '{table_name}' 
        AND COLUMN_NAME = 'IsDeleted'
    """

    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute(check_isdeleted_query)
        has_isdeleted = cursor.fetchone()[0] > 0
        cursor.close()

        where_clause = "WHERE IsDeleted = 0" if has_isdeleted else ""

        query = f"""
        SELECT 
            CAST({column_name} AS VARCHAR(500)) AS Valor,
            COUNT(*) AS Quantidade
        FROM dbo.{table_name}
        {where_clause}
        GROUP BY {column_name}
        ORDER BY Quantidade DESC
        """

        cursor = conn.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()

        results = []
        for row in rows:
            valor = row[0] if row[0] is not None else 'NULL'
            quantidade = row[1]
            results.append({
                'valor': valor,
                'quantidade': quantidade
            })

        return results

    except Exception as e:
        print(f"Erro ao extrair valores de {table_name}.{column_name}: {e}")
        return []


def extract_all_enums(db, enum_candidates, priority_only=False):
    results = {
        'extraction_date': datetime.now().isoformat(),
        'database': 'livework_fonte',
        'schema': 'dbo',
        'tables': {}
    }

    fields_by_table = enum_candidates['fields_by_table']
    priority_tables = enum_candidates.get('priority_tables', [])

    tables_to_process = priority_tables if priority_only else fields_by_table.keys()

    total_tables = len(tables_to_process)
    processed = 0

    for table_name in tables_to_process:
        if table_name not in fields_by_table:
            continue

        processed += 1
        print(f"\n[{processed}/{total_tables}] Processando tabela: {table_name}")

        results['tables'][table_name] = {
            'is_priority': table_name in priority_tables,
            'fields': {}
        }

        fields = fields_by_table[table_name]

        for field_info in fields:
            column_name = field_info['column']
            data_type = field_info['data_type']

            print(f"  - Extraindo valores de: {column_name} ({data_type})")

            values = extract_enum_values(db, table_name, column_name, data_type)

            results['tables'][table_name]['fields'][column_name] = {
                'data_type': data_type,
                'max_length': field_info.get('max_length'),
                'total_distinct_values': len(values),
                'values': values
            }

            print(f"    ✓ {len(values)} valores distintos encontrados")

    return results


def save_results(results, output_dir=None):
    output_path = Path.cwd()
    output_path.mkdir(parents=True, exist_ok=True)

    json_file = output_path / 'enum_values_extracted.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Resultados salvos em: {json_file}")

    md_file = output_path / 'Enum_Values_Report.md'
    generate_markdown_report(results, md_file)
    print(f"✓ Relatório Markdown gerado: {md_file}")


def generate_markdown_report(results, output_file):
    md_content = f"""# Relatório de Valores de Enum Extraídos

**Data de Extração:** {results['extraction_date']}  
**Banco de Dados:** {results['database']}  
**Esquema:** {results['schema']}

---

## Sumário

Total de tabelas analisadas: **{len(results['tables'])}**

"""

    total_fields = sum(len(table_data['fields']) for table_data in results['tables'].values())
    priority_tables = [t for t, data in results['tables'].items() if data['is_priority']]

    md_content += f"Total de campos analisados: **{total_fields}**  \n"
    md_content += f"Tabelas prioritárias: **{len(priority_tables)}**\n\n"

    md_content += "### Tabelas Prioritárias\n\n"
    for i, table in enumerate(priority_tables, 1):
        num_fields = len(results['tables'][table]['fields'])
        md_content += f"{i}. **{table}** ({num_fields} campos)\n"

    md_content += "\n---\n\n## Detalhamento por Tabela\n\n"

    sorted_tables = sorted(results['tables'].keys(),
                           key=lambda x: (not results['tables'][x]['is_priority'], x))

    for table_name in sorted_tables:
        table_data = results['tables'][table_name]

        md_content += f"### {table_name}\n\n"

        if table_data['is_priority']:
            md_content += "**⚠️ TABELA PRIORITÁRIA - Usada em cálculo de KPIs**\n\n"

        for field_name, field_data in table_data['fields'].items():
            md_content += f"#### Campo: `{field_name}`\n\n"
            md_content += f"- **Tipo:** {field_data['data_type']}\n"
            if field_data['max_length']:
                md_content += f"- **Tamanho Máximo:** {field_data['max_length']}\n"
            md_content += f"- **Valores Distintos:** {field_data['total_distinct_values']}\n\n"

            if field_data['values']:
                md_content += "**Valores encontrados:**\n\n"
                md_content += "| Valor | Quantidade | Percentual |\n"
                md_content += "|-------|------------|------------|\n"

                total_records = sum(v['quantidade'] for v in field_data['values'])

                for value_info in field_data['values'][:20]:
                    valor = value_info['valor']
                    qtd = value_info['quantidade']
                    pct = (qtd / total_records * 100) if total_records > 0 else 0
                    md_content += f"| `{valor}` | {qtd:,} | {pct:.2f}% |\n"

                if len(field_data['values']) > 20:
                    md_content += f"\n*... e mais {len(field_data['values']) - 20} valores*\n"
            else:
                md_content += "*Nenhum valor encontrado*\n"

            md_content += "\n"

        md_content += "---\n\n"

    md_content += """## Insights e Recomendações

### Campos Críticos para KPIs

Com base nos valores extraídos, os seguintes campos devem ser utilizados nas queries de KPIs:

"""

    if 'Titulo' in results['tables']:
        md_content += "#### Tabela: Titulo\n\n"
        if 'Status' in results['tables']['Titulo']['fields']:
            md_content += "**Campo Status:**\n"
            status_values = results['tables']['Titulo']['fields']['Status']['values']
            for sv in status_values[:10]:
                md_content += f"- `{sv['valor']}`: {sv['quantidade']:,} registros\n"
            md_content += "\n"

    md_content += """
### Próximos Passos

1. **Validar os valores** com a equipe de negócio
2. **Atualizar as queries de KPIs** com os valores corretos
3. **Criar enums no código** para garantir type safety
4. **Documentar o significado** de cada valor de enum

---

**Relatório gerado automaticamente por:** Manus AI  
**Data:** {date}
""".format(date=datetime.now().strftime('%d/%m/%Y %H:%M:%S'))

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md_content)


def main():
    print("=" * 80)
    print("EXTRAÇÃO DE VALORES DE ENUM - Dashboard Fonte")
    print("=" * 80)

    load_dotenv()

    required_vars = ['DB_SERVER', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        print(f"\n❌ Erro: Variáveis de ambiente faltando: {', '.join(missing_vars)}")
        print("Configure o arquivo .env antes de executar este script.")
        sys.exit(1)

    print("\n1. Carregando lista de campos candidatos a enum...")
    enum_candidates = load_enum_candidates()
    print(f"   ✓ {enum_candidates['total_fields']} campos em {enum_candidates['total_tables']} tabelas")

    print("\n2. Opções de processamento:")
    print("   [1] Processar apenas tabelas prioritárias (recomendado)")
    print("   [2] Processar todas as tabelas")

    choice = input("\nEscolha uma opção (1 ou 2): ").strip()
    priority_only = choice == '1'

    print("\n3. Conectando ao banco de dados...")
    db = Database()
    try:
        db.connect()
        print("   ✓ Conexão estabelecida com sucesso!")

        print("\n4. Extraindo valores de enum...")
        results = extract_all_enums(db, enum_candidates, priority_only)

        print("\n5. Salvando resultados...")
        save_results(results)

        print("\n" + "=" * 80)
        print("✓ EXTRAÇÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 80)

    except Exception as e:
        print(f"\n❌ Erro durante a extração: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        db.close_connection()
        print("\n✓ Conexão com o banco de dados encerrada.")


if __name__ == "__main__":
    main()
