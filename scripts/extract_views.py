#!/usr/bin/env python3
"""
Script para analisar colunas das views e identificar pares enum + descrição

Este script busca padrões como:
- Status + StatusDescricao
- Tipo + TipoNome
- Codigo + Descricao

E gera queries para extrair os mapeamentos de enum

Autor: Dashboard Fonte Team
Data: 31 de outubro de 2025
Versão: 1.0
"""

import sys
import os
from pathlib import Path
from datetime import datetime
from tqdm import tqdm
import json

# Adiciona o diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.infra.db_connection import Database


class ViewColumnAnalyzer:
    """Analisador de colunas de views para encontrar mapeamentos de enum"""

    def __init__(self, output_dir='./data/view_analysis'):
        """
        Inicializa o analisador

        Args:
            output_dir (str): Diretório onde os resultados serão salvos
        """
        self.output_dir = Path(output_dir)
        self.db = Database()
        self.views_analyzed = []
        self.enum_candidates = []

    def create_output_directory(self):
        """Cria o diretório de saída se não existir"""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        print(f"📁 Diretório de saída: {self.output_dir.absolute()}")

    def get_all_views(self):
        """
        Busca lista de todas as views no schema dbo

        Returns:
            list: Lista de tuplas (schema_name, view_name)
        """
        query = """
            SELECT 
                SCHEMA_NAME(schema_id) AS SchemaName,
                name AS ViewName,
                create_date AS CreateDate,
                modify_date AS ModifyDate
            FROM sys.views
            WHERE SCHEMA_NAME(schema_id) = 'dbo'
            ORDER BY name;
        """

        try:
            results = self.db.execute_query(query)
            return results
        except Exception as e:
            print(f"❌ Erro ao buscar lista de views: {e}")
            return []

    def get_view_columns(self, schema_name, view_name):
        """
        Busca informações sobre as colunas da view

        Args:
            schema_name (str): Nome do schema
            view_name (str): Nome da view

        Returns:
            list: Lista de tuplas (column_name, data_type, max_length, precision, scale, is_nullable)
        """
        query = """
            SELECT 
                c.name AS ColumnName,
                t.name AS DataType,
                c.max_length AS MaxLength,
                c.precision AS Precision,
                c.scale AS Scale,
                c.is_nullable AS IsNullable,
                c.column_id AS ColumnId
            FROM sys.views v
            INNER JOIN sys.columns c ON v.object_id = c.object_id
            INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
            WHERE SCHEMA_NAME(v.schema_id) = ?
              AND v.name = ?
            ORDER BY c.column_id;
        """

        try:
            results = self.db.execute_query(query, (schema_name, view_name))
            return results
        except Exception as e:
            print(f"❌ Erro ao buscar colunas de {schema_name}.{view_name}: {e}")
            return []

    def identify_enum_patterns(self, columns):
        """
        Identifica padrões de enum + descrição nas colunas

        Padrões procurados:
        - Campo + CampoDescricao
        - Campo + CampoNome
        - Campo + CampoTexto
        - Codigo + Descricao
        - Id + Nome

        Args:
            columns (list): Lista de colunas da view

        Returns:
            list: Lista de pares (campo_enum, campo_descricao) encontrados
        """
        patterns = []
        column_names = [col[0] for col in columns]
        column_dict = {col[0]: col for col in columns}

        # Sufixos comuns para descrição
        desc_suffixes = ['Descricao', 'Nome', 'Texto', 'Legenda', 'Label', 'Description', 'Name']

        for col_name in column_names:
            # Verifica se é um campo numérico (possível enum)
            col_info = column_dict[col_name]
            data_type = col_info[1]

            # Tipos que podem ser enum
            if data_type in ['int', 'tinyint', 'smallint', 'bigint']:
                # Procura por campo de descrição correspondente
                for suffix in desc_suffixes:
                    desc_field = f"{col_name}{suffix}"
                    if desc_field in column_names:
                        desc_info = column_dict[desc_field]
                        desc_type = desc_info[1]

                        # Verifica se é um campo de texto
                        if desc_type in ['varchar', 'nvarchar', 'char', 'nchar', 'text', 'ntext']:
                            patterns.append({
                                'enum_field': col_name,
                                'enum_type': data_type,
                                'desc_field': desc_field,
                                'desc_type': desc_type,
                                'pattern': f"{col_name} + {suffix}"
                            })
                            break  # Encontrou, não precisa testar outros sufixos

        return patterns

    def generate_extraction_query(self, schema_name, view_name, enum_patterns):
        """
        Gera query SQL para extrair os mapeamentos de enum

        Args:
            schema_name (str): Nome do schema
            view_name (str): Nome da view
            enum_patterns (list): Lista de padrões de enum encontrados

        Returns:
            str: Query SQL para extrair os mapeamentos
        """
        if not enum_patterns:
            return None

        queries = []

        for pattern in enum_patterns:
            enum_field = pattern['enum_field']
            desc_field = pattern['desc_field']

            query = f"""
-- Mapeamento: {enum_field} → {desc_field}
SELECT DISTINCT
    {enum_field},
    {desc_field},
    COUNT(*) AS Quantidade
FROM {schema_name}.{view_name}
WHERE {enum_field} IS NOT NULL
  AND {desc_field} IS NOT NULL
GROUP BY {enum_field}, {desc_field}
ORDER BY {enum_field};
"""
            queries.append(query)

        return "\n".join(queries)

    def analyze_all_views(self):
        """Analisa todas as views do banco e identifica padrões de enum"""
        print("\n🔍 Buscando lista de views...")
        views = self.get_all_views()

        if not views:
            print("❌ Nenhuma view encontrada ou erro ao buscar.")
            return

        total_views = len(views)
        print(f"✅ Encontradas {total_views} views no schema dbo\n")

        # Cria diretório de saída
        self.create_output_directory()

        # Processa cada view
        print("📊 Analisando colunas...\n")
        for view_info in tqdm(views, desc="Analisando views", unit="view"):
            schema_name = view_info[0]
            view_name = view_info[1]
            create_date = view_info[2]
            modify_date = view_info[3]

            # Busca colunas
            columns = self.get_view_columns(schema_name, view_name)

            if columns:
                # Identifica padrões de enum
                enum_patterns = self.identify_enum_patterns(columns)

                if enum_patterns:
                    # Gera query de extração
                    extraction_query = self.generate_extraction_query(
                        schema_name,
                        view_name,
                        enum_patterns
                    )

                    self.views_analyzed.append({
                        'schema': schema_name,
                        'view': view_name,
                        'columns': len(columns),
                        'enum_patterns': enum_patterns,
                        'extraction_query': extraction_query,
                        'create_date': create_date.isoformat() if create_date else None,
                        'modify_date': modify_date.isoformat() if modify_date else None
                    })

                    # Adiciona aos candidatos globais
                    for pattern in enum_patterns:
                        self.enum_candidates.append({
                            'view': f"{schema_name}.{view_name}",
                            'enum_field': pattern['enum_field'],
                            'desc_field': pattern['desc_field'],
                            'pattern': pattern['pattern']
                        })

        # Gera relatórios
        self.generate_reports()

        # Fecha conexão
        self.db.close_connection()

    def generate_reports(self):
        """Gera relatórios da análise"""
        print("\n" + "=" * 80)
        print("📊 RESUMO DA ANÁLISE")
        print("=" * 80)
        print(f"✅ Views analisadas: {len(self.views_analyzed)}")
        print(f"🎯 Views com padrões de enum: {len([v for v in self.views_analyzed if v['enum_patterns']])}")
        print(f"📋 Total de pares enum+descrição encontrados: {len(self.enum_candidates)}")
        print("=" * 80)

        # 1. Salva metadados em JSON
        metadata = {
            'analysis_date': datetime.now().isoformat(),
            'total_views_analyzed': len(self.views_analyzed),
            'views_with_patterns': len([v for v in self.views_analyzed if v['enum_patterns']]),
            'total_enum_candidates': len(self.enum_candidates),
            'views': self.views_analyzed,
            'enum_candidates': self.enum_candidates
        }

        metadata_file = self.output_dir / 'view_analysis_metadata.json'
        try:
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            print(f"\n📄 Metadados salvos em: {metadata_file}")
        except Exception as e:
            print(f"\n❌ Erro ao salvar metadados: {e}")

        # 2. Gera arquivo SQL com todas as queries de extração
        sql_file = self.output_dir / 'extract_enum_mappings.sql'
        try:
            with open(sql_file, 'w', encoding='utf-8') as f:
                f.write("-- " + "=" * 78 + "\n")
                f.write("-- QUERIES PARA EXTRAIR MAPEAMENTOS DE ENUM DAS VIEWS\n")
                f.write("-- " + "=" * 78 + "\n")
                f.write(f"-- Gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(
                    f"-- Total de views com padrões: {len([v for v in self.views_analyzed if v['enum_patterns']])}\n")
                f.write("-- " + "=" * 78 + "\n\n")

                for view_data in self.views_analyzed:
                    if view_data['extraction_query']:
                        f.write("-- " + "-" * 78 + "\n")
                        f.write(f"-- VIEW: {view_data['schema']}.{view_data['view']}\n")
                        f.write(f"-- Padrões encontrados: {len(view_data['enum_patterns'])}\n")
                        f.write("-- " + "-" * 78 + "\n\n")
                        f.write(view_data['extraction_query'])
                        f.write("\n\n")

                f.write("-- " + "=" * 78 + "\n")
                f.write("-- FIM DAS QUERIES\n")
                f.write("-- " + "=" * 78 + "\n")

            print(f"📄 Queries SQL salvas em: {sql_file}")
        except Exception as e:
            print(f"❌ Erro ao salvar queries SQL: {e}")

        # 3. Gera relatório Markdown
        md_file = self.output_dir / 'ENUM_PATTERNS_REPORT.md'
        try:
            with open(md_file, 'w', encoding='utf-8') as f:
                f.write("# Relatório de Análise de Padrões de Enum\n\n")
                f.write(f"**Data da Análise**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                f.write("---\n\n")

                f.write("## 📊 Resumo\n\n")
                f.write(f"- **Views analisadas**: {len(self.views_analyzed)}\n")
                f.write(
                    f"- **Views com padrões de enum**: {len([v for v in self.views_analyzed if v['enum_patterns']])}\n")
                f.write(f"- **Total de pares enum+descrição**: {len(self.enum_candidates)}\n\n")

                f.write("---\n\n")

                f.write("## 🎯 Pares Enum + Descrição Encontrados\n\n")

                if self.enum_candidates:
                    f.write("| View | Campo Enum | Campo Descrição | Padrão |\n")
                    f.write("|------|------------|-----------------|--------|\n")
                    for candidate in self.enum_candidates:
                        f.write(
                            f"| `{candidate['view']}` | `{candidate['enum_field']}` | `{candidate['desc_field']}` | {candidate['pattern']} |\n")
                else:
                    f.write("*Nenhum padrão encontrado.*\n")

                f.write("\n---\n\n")

                f.write("## 📋 Detalhamento por View\n\n")

                for view_data in self.views_analyzed:
                    if view_data['enum_patterns']:
                        f.write(f"### {view_data['schema']}.{view_data['view']}\n\n")
                        f.write(f"**Colunas**: {view_data['columns']}\n\n")
                        f.write(f"**Padrões encontrados**: {len(view_data['enum_patterns'])}\n\n")

                        for pattern in view_data['enum_patterns']:
                            f.write(
                                f"- **{pattern['enum_field']}** ({pattern['enum_type']}) → **{pattern['desc_field']}** ({pattern['desc_type']})\n")

                        f.write("\n**Query de extração**:\n\n")
                        f.write("```sql\n")
                        f.write(view_data['extraction_query'])
                        f.write("\n```\n\n")
                        f.write("---\n\n")

                f.write("## 🚀 Próximos Passos\n\n")
                f.write("1. Execute as queries do arquivo `extract_enum_mappings.sql`\n")
                f.write("2. Analise os resultados para descobrir os valores de enum\n")
                f.write("3. Documente os mapeamentos encontrados\n")
                f.write("4. Atualize as queries do dashboard com os valores corretos\n\n")

            print(f"📄 Relatório Markdown salvo em: {md_file}")
        except Exception as e:
            print(f"❌ Erro ao salvar relatório Markdown: {e}")

        print("\n✅ Análise concluída!\n")


def main():
    """Função principal"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Analisa colunas de views para encontrar padrões de enum + descrição'
    )
    parser.add_argument(
        '--output',
        '-o',
        default='./data/view_analysis',
        help='Diretório de saída para os resultados (padrão: ./data/view_analysis)'
    )

    args = parser.parse_args()

    print("=" * 80)
    print("🔍 ANALISADOR DE COLUNAS DE VIEWS - LiveWork Database")
    print("=" * 80)

    analyzer = ViewColumnAnalyzer(output_dir=args.output)
    analyzer.analyze_all_views()


if __name__ == '__main__':
    main()

