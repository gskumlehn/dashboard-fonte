"""
Script para extrair valores de campos CRÍTICOS para segmentação de negócio.
Foco em campos como Operacao.Tipo, Operacao.Status, Titulo.Status, etc.

Autor: Manus AI
Data: 22 de outubro de 2025
"""

import json
import sys
import os
from datetime import datetime
from pathlib import Path

# Adicionar o diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.infra.db_connection import Database
from dotenv import load_dotenv

# Definição dos campos CRÍTICOS para análise de negócio
CRITICAL_FIELDS = {
    'Operacao': [
        {'field': 'Tipo', 'description': 'Tipo de operação de fomento'},
        {'field': 'Status', 'description': 'Status atual da operação'},
        {'field': 'ModalidadeId', 'description': 'Modalidade da operação (FK)'},
    ],
    'Titulo': [
        {'field': 'Status', 'description': 'Status do título (ativo, liquidado, inadimplente)'},
        {'field': 'Tipo', 'description': 'Tipo de título (duplicata, cheque, etc.)'},
        {'field': 'TipoDocId', 'description': 'Tipo de documento (FK)'},
    ],
    'Cliente': [
        {'field': 'Tipo', 'description': 'Tipo de cliente'},
        {'field': 'Status', 'description': 'Status do cliente'},
    ],
    'Cedente': [
        {'field': 'Tipo', 'description': 'Tipo de cedente'},
        {'field': 'Status', 'description': 'Status do cedente'},
    ],
    'Sacado': [
        {'field': 'Tipo', 'description': 'Tipo de sacado'},
        {'field': 'Status', 'description': 'Status do sacado'},
    ],
    'Modalidade': [
        {'field': 'Id', 'description': 'ID da modalidade'},
        {'field': 'Nome', 'description': 'Nome da modalidade'},
        {'field': 'Descricao', 'description': 'Descrição da modalidade'},
    ],
    'TipoDoc': [
        {'field': 'Id', 'description': 'ID do tipo de documento'},
        {'field': 'Nome', 'description': 'Nome do tipo de documento'},
        {'field': 'Descricao', 'description': 'Descrição do tipo de documento'},
    ],
    'OperacaoCliente': [
        {'field': 'Status', 'description': 'Status da relação operação-cliente'},
        {'field': 'ModalidadeId', 'description': 'Modalidade (FK)'},
    ],
    'OperacaoCheckList': [
        {'field': 'Tipo', 'description': 'Tipo de checklist'},
        {'field': 'Status', 'description': 'Status do checklist'},
    ],
    'OperacaoFechamento': [
        {'field': 'Tipo', 'description': 'Tipo de fechamento'},
        {'field': 'Status', 'description': 'Status do fechamento'},
    ],
    'MovimentacaoFinanceira': [
        {'field': 'Tipo', 'description': 'Tipo de movimentação'},
        {'field': 'Status', 'description': 'Status da movimentação'},
    ],
    'Pagamento': [
        {'field': 'Tipo', 'description': 'Tipo de pagamento'},
        {'field': 'Status', 'description': 'Status do pagamento'},
    ],
    'Recebimento': [
        {'field': 'Tipo', 'description': 'Tipo de recebimento'},
        {'field': 'Status', 'description': 'Status do recebimento'},
    ],
}


def check_table_exists(db, table_name):
    """Verifica se a tabela existe no banco."""
    query = """
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = ?
    """
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute(query, (table_name,))
        exists = cursor.fetchone()[0] > 0
        cursor.close()
        return exists
    except Exception as e:
        print(f"Erro ao verificar tabela {table_name}: {e}")
        return False


def check_column_exists(db, table_name, column_name):
    """Verifica se a coluna existe na tabela."""
    query = """
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = ? AND COLUMN_NAME = ?
    """
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute(query, (table_name, column_name))
        exists = cursor.fetchone()[0] > 0
        cursor.close()
        return exists
    except Exception as e:
        print(f"Erro ao verificar coluna {table_name}.{column_name}: {e}")
        return False


def get_column_type(db, table_name, column_name):
    """Obtém o tipo de dado da coluna."""
    query = """
    SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = ? AND COLUMN_NAME = ?
    """
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute(query, (table_name, column_name))
        result = cursor.fetchone()
        cursor.close()
        if result:
            data_type = result[0]
            max_length = result[1]
            return {'type': data_type, 'max_length': max_length}
        return None
    except Exception as e:
        print(f"Erro ao obter tipo de {table_name}.{column_name}: {e}")
        return None


def extract_enum_values(db, table_name, column_name):
    """Extrai valores distintos de um campo."""
    # Verificar se tem IsDeleted
    has_isdeleted = check_column_exists(db, table_name, 'IsDeleted')
    where_clause = "WHERE IsDeleted = 0" if has_isdeleted else ""

    query = f"""
    SELECT 
        CAST({column_name} AS NVARCHAR(MAX)) AS Valor,
        COUNT(*) AS Quantidade
    FROM dbo.{table_name}
    {where_clause}
    GROUP BY {column_name}
    ORDER BY Quantidade DESC
    """

    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()

        total = sum(row[1] for row in rows)

        results = []
        for row in rows:
            valor = row[0] if row[0] is not None else 'NULL'
            quantidade = row[1]
            percentual = (quantidade / total * 100) if total > 0 else 0
            results.append({
                'valor': valor,
                'quantidade': quantidade,
                'percentual': round(percentual, 2)
            })

        return results

    except Exception as e:
        print(f"  ❌ Erro ao extrair: {e}")
        return []


def extract_lookup_table(db, table_name):
    """Extrai todos os registros de uma tabela de lookup (Modalidade, TipoDoc, etc.)."""
    # Verificar se tem IsDeleted
    has_isdeleted = check_column_exists(db, table_name, 'IsDeleted')
    where_clause = "WHERE IsDeleted = 0" if has_isdeleted else ""

    # Tentar identificar colunas comuns
    common_columns = ['Id', 'Nome', 'Descricao', 'Codigo', 'Sigla']
    available_columns = []

    for col in common_columns:
        if check_column_exists(db, table_name, col):
            available_columns.append(col)

    if not available_columns:
        return []

    select_clause = ', '.join(available_columns)
    query = f"""
    SELECT {select_clause}
    FROM dbo.{table_name}
    {where_clause}
    ORDER BY Id
    """

    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()

        results = []
        for row in rows:
            record = {}
            for i, col_name in enumerate(available_columns):
                record[col_name] = str(row[i]) if row[i] is not None else None
            results.append(record)

        return results

    except Exception as e:
        print(f"  ❌ Erro ao extrair tabela lookup: {e}")
        return []


def extract_all_critical_fields(db):
    """Extrai valores de todos os campos críticos."""
    results = {
        'extraction_date': datetime.now().isoformat(),
        'database': 'livework_fonte',
        'schema': 'dbo',
        'purpose': 'Extração de campos críticos para segmentação de negócio e KPIs',
        'tables': {}
    }

    print("\n" + "=" * 80)
    print("EXTRAÇÃO DE CAMPOS CRÍTICOS PARA SEGMENTAÇÃO")
    print("=" * 80 + "\n")

    total_tables = len(CRITICAL_FIELDS)
    processed = 0

    for table_name, fields in CRITICAL_FIELDS.items():
        processed += 1
        print(f"[{processed}/{total_tables}] Tabela: {table_name}")

        # Verificar se a tabela existe
        if not check_table_exists(db, table_name):
            print(f"  ⚠️  Tabela não encontrada no banco\n")
            continue

        results['tables'][table_name] = {
            'exists': True,
            'fields': {}
        }

        # Se for tabela de lookup (Modalidade, TipoDoc), extrair todos os registros
        if table_name in ['Modalidade', 'TipoDoc']:
            print(f"  📋 Extraindo tabela de lookup completa...")
            lookup_data = extract_lookup_table(db, table_name)
            results['tables'][table_name]['lookup_data'] = lookup_data
            print(f"  ✓ {len(lookup_data)} registros encontrados\n")
            continue

        # Extrair cada campo
        for field_info in fields:
            field_name = field_info['field']
            description = field_info['description']

            # Verificar se o campo existe
            if not check_column_exists(db, table_name, field_name):
                print(f"  ⚠️  Campo '{field_name}' não encontrado")
                results['tables'][table_name]['fields'][field_name] = {
                    'exists': False,
                    'description': description
                }
                continue

            # Obter tipo do campo
            col_type = get_column_type(db, table_name, field_name)

            print(f"  🔍 {field_name} ({col_type['type']}) - {description}")

            # Extrair valores
            values = extract_enum_values(db, table_name, field_name)

            results['tables'][table_name]['fields'][field_name] = {
                'exists': True,
                'description': description,
                'data_type': col_type['type'],
                'max_length': col_type['max_length'],
                'distinct_values': len(values),
                'values': values
            }

            print(f"     ✓ {len(values)} valores distintos")

            # Mostrar os 5 valores mais comuns
            for v in values[:5]:
                print(f"       • {v['valor']}: {v['quantidade']:,} ({v['percentual']}%)")

        print()

    return results


def generate_markdown_report(results, output_file):
    """Gera relatório em Markdown."""

    md = f"""# Relatório de Campos Críticos para Segmentação

**Data de Extração:** {results['extraction_date']}  
**Banco de Dados:** {results['database']}  
**Esquema:** {results['schema']}

---

## Objetivo

Este relatório contém os valores reais extraídos dos campos mais importantes para:
- **Segmentação de gráficos e dashboards**
- **Cálculo de KPIs**
- **Filtros e análises de negócio**

---

## Sumário Executivo

"""

    # Contar estatísticas
    total_tables = len([t for t in results['tables'].values() if t.get('exists')])
    total_fields = sum(len(t.get('fields', {})) for t in results['tables'].values())

    md += f"- **Tabelas analisadas:** {total_tables}\n"
    md += f"- **Campos analisados:** {total_fields}\n\n"

    md += "---\n\n"

    # Detalhamento por tabela
    for table_name, table_data in results['tables'].items():
        if not table_data.get('exists'):
            continue

        md += f"## Tabela: {table_name}\n\n"

        # Se for tabela de lookup
        if 'lookup_data' in table_data:
            md += "**Tipo:** Tabela de Lookup (Referência)\n\n"
            lookup_data = table_data['lookup_data']

            if lookup_data:
                md += "| " + " | ".join(lookup_data[0].keys()) + " |\n"
                md += "|" + "|".join(["---" for _ in lookup_data[0].keys()]) + "|\n"

                for record in lookup_data:
                    md += "| " + " | ".join([str(v) if v else '-' for v in record.values()]) + " |\n"

            md += "\n---\n\n"
            continue

        # Campos normais
        fields = table_data.get('fields', {})

        for field_name, field_data in fields.items():
            if not field_data.get('exists'):
                md += f"### ⚠️ Campo: `{field_name}` (NÃO ENCONTRADO)\n\n"
                md += f"**Descrição:** {field_data['description']}\n\n"
                continue

            md += f"### Campo: `{field_name}`\n\n"
            md += f"**Descrição:** {field_data['description']}  \n"
            md += f"**Tipo de Dado:** {field_data['data_type']}  \n"
            if field_data['max_length']:
                md += f"**Tamanho Máximo:** {field_data['max_length']}  \n"
            md += f"**Valores Distintos:** {field_data['distinct_values']}\n\n"

            if field_data['values']:
                md += "**Distribuição de Valores:**\n\n"
                md += "| Valor | Quantidade | Percentual |\n"
                md += "|-------|------------|------------|\n"

                for value_info in field_data['values']:
                    valor = value_info['valor']
                    qtd = value_info['quantidade']
                    pct = value_info['percentual']
                    md += f"| `{valor}` | {qtd:,} | {pct}% |\n"

                md += "\n"

            md += "---\n\n"

    # Seção de insights
    md += """## Insights e Recomendações

### Como Usar Estes Dados

1. **Filtros no Dashboard:**
   - Use os valores de `Operacao.Tipo` e `Operacao.Status` para criar filtros
   - Permita segmentação por `ModalidadeId` (referenciando a tabela Modalidade)

2. **Queries de KPIs:**
   - Atualize as queries SQL com os valores corretos de Status
   - Exemplo: `WHERE Operacao.Status = 1` (se 1 = Ativa)

3. **Gráficos:**
   - Crie gráficos segmentados por Tipo de Operação
   - Analise inadimplência por Modalidade
   - Compare performance entre diferentes Status

4. **Validação:**
   - Confirme com a equipe de negócio o significado de cada valor
   - Documente o mapeamento (ex: Status 1 = Ativa, 2 = Concluída, etc.)

### Próximos Passos

1. ✅ Valores extraídos do banco
2. ⏳ Validar significado com equipe de negócio
3. ⏳ Criar enums no código (Python/TypeScript)
4. ⏳ Atualizar queries de KPIs
5. ⏳ Implementar filtros no dashboard

---

**Relatório gerado por:** Manus AI  
**Data:** {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
"""

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md)


def main():
    """Função principal."""
    print("=" * 80)
    print("EXTRAÇÃO DE CAMPOS CRÍTICOS PARA SEGMENTAÇÃO DE NEGÓCIO")
    print("=" * 80)

    # Carregar variáveis de ambiente
    load_dotenv()

    # Verificar variáveis
    required_vars = ['DB_SERVER', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        print(f"\n❌ Erro: Variáveis de ambiente faltando: {', '.join(missing_vars)}")
        print("Configure o arquivo .env antes de executar este script.")
        sys.exit(1)

    # Conectar ao banco
    print("\n🔌 Conectando ao banco de dados...")
    db = Database()

    try:
        db.connect()
        print("✓ Conexão estabelecida!\n")

        # Extrair dados
        results = extract_all_critical_fields(db)

        # Salvar resultados
        print("\n💾 Salvando resultados...")
        output_dir = 'analisys'
        output_dir.mkdir(parents=True, exist_ok=True)

        # JSON
        json_file = output_dir / 'business_enums_extracted.json'
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"✓ JSON salvo: {json_file}")

        # Markdown
        md_file = output_dir / 'Business_Enums_Report.md'
        generate_markdown_report(results, md_file)
        print(f"✓ Relatório Markdown: {md_file}")

        print("\n" + "=" * 80)
        print("✅ EXTRAÇÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 80)
        print(f"\nArquivos gerados em: {output_dir}")

    except Exception as e:
        print(f"\n❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        db.close_connection()
        print("\n✓ Conexão encerrada.")


if __name__ == "__main__":
    main()

