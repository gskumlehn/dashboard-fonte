#!/usr/bin/env python3
"""
Script para analisar colunas de views e identificar padrões de enum+descrição

Este script:
1. Lista todas as views do banco de dados
2. Analisa as colunas de cada view
3. Identifica padrões de enum+descrição (ex: Status + StatusDescricao)
4. Gera queries SQL para extrair os mapeamentos
5. Salva metadados em JSON

Autor: Dashboard Fonte Team
Data: 31 de outubro de 2025
Versão: 1.0
"""

import sys
import os
from datetime import datetime
import json
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.infra.db_connection import Database


class ViewColumnAnalyzer:
    """Analisador de colunas de views para identificar padrões de enum"""
    
    # Padrões comuns de sufixos de descrição
    DESC_PATTERNS = [
        'Descricao',
        'Desc',
        'Descr',
        'Description',
        'Nome',
        'Name',
        'Texto',
        'Text',
        'Label',
        'Titulo',
        'Title'
    ]
    
    # Tipos de dados que indicam enum
    ENUM_TYPES = [
        'tinyint',
        'smallint',
        'int',
        'bigint',
        'bit'
    ]
    
    # Tipos de dados que indicam descrição
    DESC_TYPES = [
        'varchar',
        'nvarchar',
        'char',
        'nchar',
        'text',
        'ntext'
    ]
    
    def __init__(self, output_dir='#analysis/views_analysis'):
        """
        Inicializa o analisador
        
        Args:
            output_dir (str): Diretório onde os resultados serão salvos
        """
        self.output_dir = os.path.abspath(output_dir)
        self.db = Database()
        self.views = []
        self.enum_patterns = []
        
    def create_output_directory(self):
        """Cria o diretório de saída se não existir"""
        os.makedirs(self.output_dir, exist_ok=True)

    def get_all_views(self):
        """
        Obtém lista de todas as views do banco de dados
        
        Returns:
            list: Lista de tuplas (schema, view_name)
        """
        query = """
            SELECT 
                TABLE_SCHEMA,
                TABLE_NAME
            FROM INFORMATION_SCHEMA.VIEWS
            WHERE TABLE_SCHEMA NOT IN ('sys', 'INFORMATION_SCHEMA')
            ORDER BY TABLE_SCHEMA, TABLE_NAME;
        """
        
        try:
            results = self.db.execute_query(query)
            return results
        except Exception as e:
            return []
    
    def get_view_columns(self, schema_name, view_name):
        """
        Obtém informações sobre as colunas de uma view
        
        Args:
            schema_name (str): Nome do schema
            view_name (str): Nome da view
            
        Returns:
            list: Lista de dicionários com informações das colunas
        """
        query = f"""
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                NUMERIC_PRECISION,
                ORDINAL_POSITION
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '{schema_name}'
              AND TABLE_NAME = '{view_name}'
            ORDER BY ORDINAL_POSITION;
        """
        
        try:
            results = self.db.execute_query(query)
            return [
                {
                    'name': row[0],
                    'type': row[1],
                    'max_length': row[2],
                    'precision': row[3],
                    'position': row[4]
                }
                for row in results
            ]
        except Exception as e:
            return []
    
    def identify_enum_patterns(self, columns):
        """
        Identifica padrões de enum+descrição nas colunas
        
        Args:
            columns (list): Lista de colunas da view
            
        Returns:
            list: Lista de padrões identificados
        """
        patterns = []
        
        # Cria dicionário de colunas por nome
        col_dict = {col['name']: col for col in columns}
        
        # Para cada coluna que pode ser enum
        for col in columns:
            if col['type'] not in self.ENUM_TYPES:
                continue
            
            enum_name = col['name']
            
            # Procura por colunas de descrição correspondentes
            for desc_suffix in self.DESC_PATTERNS:
                # Padrão 1: EnumNomeDescricao (ex: StatusDescricao)
                desc_name = f"{enum_name}{desc_suffix}"
                
                if desc_name in col_dict and col_dict[desc_name]['type'] in self.DESC_TYPES:
                    patterns.append({
                        'enum_field': enum_name,
                        'enum_type': col['type'],
                        'desc_field': desc_name,
                        'desc_type': col_dict[desc_name]['type'],
                        'pattern': f'{enum_name}+{desc_suffix}'
                    })
                    continue
                
                # Padrão 2: EnumNome_Descricao (ex: Status_Descricao)
                desc_name = f"{enum_name}_{desc_suffix}"
                
                if desc_name in col_dict and col_dict[desc_name]['type'] in self.DESC_TYPES:
                    patterns.append({
                        'enum_field': enum_name,
                        'enum_type': col['type'],
                        'desc_field': desc_name,
                        'desc_type': col_dict[desc_name]['type'],
                        'pattern': f'{enum_name}+_{desc_suffix}'
                    })
                    continue
                
                # Padrão 3: Descricao do enum sem prefixo (ex: Status + Descricao)
                if desc_suffix in col_dict and col_dict[desc_suffix]['type'] in self.DESC_TYPES:
                    # Verifica se não é muito genérico
                    if enum_name.lower() in desc_suffix.lower() or len(columns) < 10:
                        patterns.append({
                            'enum_field': enum_name,
                            'enum_type': col['type'],
                            'desc_field': desc_suffix,
                            'desc_type': col_dict[desc_suffix]['type'],
                            'pattern': f'{enum_name}+{desc_suffix}'
                        })
        
        return patterns
    
    def analyze_all_views(self):
        """Analisa todas as views do banco de dados"""
        # Cria diretório de saída
        self.create_output_directory()
        
        # Obtém lista de views
        views_list = self.get_all_views()
        
        if not views_list:
            return
        
        # Analisa cada view
        with tqdm(total=len(views_list), desc="Analisando views", unit="view") as pbar:
            for schema_name, view_name in views_list:
                # Obtém colunas da view
                columns = self.get_view_columns(schema_name, view_name)
                
                if not columns:
                    pbar.update(1)
                    continue
                
                # Identifica padrões de enum
                patterns = self.identify_enum_patterns(columns)
                
                # Armazena resultado
                view_data = {
                    'schema': schema_name,
                    'view': view_name,
                    'total_columns': len(columns),
                    'columns': columns,
                    'enum_patterns': patterns
                }
                
                self.views.append(view_data)
                
                if patterns:
                    self.enum_patterns.extend([
                        {
                            'schema': schema_name,
                            'view': view_name,
                            **pattern
                        }
                        for pattern in patterns
                    ])
                
                pbar.update(1)
        
        # Gera relatórios
        self.generate_reports()
        
        # Fecha conexão
        self.db.close_connection()
    
    def generate_reports(self):
        """Gera relatórios com os resultados da análise"""
        views_with_patterns = [v for v in self.views if v['enum_patterns']]
        
        metadata = {
            'analysis_date': datetime.now().isoformat(),
            'total_views_analyzed': len(self.views),
            'views_with_patterns': len(views_with_patterns),
            'total_enum_candidates': len(self.enum_patterns),
            'views': self.views
        }

        # 1. Salva metadados em JSON
        json_file = os.path.join(self.output_dir, 'view_analysis_metadata.json')
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)

        print(f"📄 Metadados salvos em: {json_file}")

        # 2. Gera queries SQL para extração
        sql_file = self.output_dir / 'extract_enum_mappings.sql'
        try:
            with open(sql_file, 'w', encoding='utf-8') as f:
                self._write_sql_queries(f)
            
            print(f"📄 Queries SQL salvas em: {sql_file}")
        except Exception as e:
            print(f"❌ Erro ao salvar queries SQL: {e}")
        
        # 3. Gera relatório Markdown
        md_file = self.output_dir / 'ENUM_PATTERNS_REPORT.md'
        try:
            with open(md_file, 'w', encoding='utf-8') as f:
                self._write_markdown_report(f)
            
            print(f"📄 Relatório Markdown salvo em: {md_file}")
        except Exception as e:
            print(f"❌ Erro ao salvar relatório: {e}")
        
        print("\n✅ Análise concluída!\n")
        print("🚀 Próximo passo: Execute o script extract_enum_meanings.py para extrair os valores\n")
    
    def _write_sql_queries(self, f):
        """Gera arquivo SQL com queries para extrair mapeamentos"""
        f.write("-- Queries para Extração de Mapeamentos de Enum\n")
        f.write(f"-- Gerado automaticamente em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("-- NÃO EDITE MANUALMENTE\n\n")
        f.write("-- " + "=" * 76 + "\n\n")
        
        # Agrupa por view
        views_with_patterns = [v for v in self.views if v['enum_patterns']]
        
        for view_data in views_with_patterns:
            schema_name = view_data['schema']
            view_name = view_data['view']
            
            f.write(f"-- View: {schema_name}.{view_name}\n")
            f.write("-- " + "-" * 76 + "\n\n")
            
            for pattern in view_data['enum_patterns']:
                enum_field = pattern['enum_field']
                desc_field = pattern['desc_field']
                
                f.write(f"-- {enum_field} ({pattern['enum_type']}) -> {desc_field} ({pattern['desc_type']})\n")
                f.write(f"SELECT DISTINCT\n")
                f.write(f"    {enum_field} AS Valor,\n")
                f.write(f"    {desc_field} AS Descricao,\n")
                f.write(f"    COUNT(*) AS Quantidade\n")
                f.write(f"FROM {schema_name}.{view_name}\n")
                f.write(f"WHERE {enum_field} IS NOT NULL\n")
                f.write(f"  AND {desc_field} IS NOT NULL\n")
                f.write(f"GROUP BY {enum_field}, {desc_field}\n")
                f.write(f"ORDER BY {enum_field};\n\n")
            
            f.write("\n")
    
    def _write_markdown_report(self, f):
        """Gera relatório Markdown com os padrões encontrados"""
        f.write("# Análise de Padrões de Enum em Views\n\n")
        f.write(f"**Data da Análise**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("---\n\n")
        
        f.write("## 📊 Resumo\n\n")
        
        views_with_patterns = [v for v in self.views if v['enum_patterns']]
        
        f.write(f"- **Total de views analisadas**: {len(self.views)}\n")
        f.write(f"- **Views com padrões de enum**: {len(views_with_patterns)}\n")
        f.write(f"- **Total de pares enum+descrição**: {len(self.enum_patterns)}\n\n")
        
        f.write("---\n\n")
        
        # Estatísticas por tipo de padrão
        f.write("## 📈 Estatísticas por Tipo de Padrão\n\n")
        
        pattern_types = {}
        for pattern in self.enum_patterns:
            pattern_key = pattern['pattern'].split('+')[1]  # Pega o sufixo
            pattern_types[pattern_key] = pattern_types.get(pattern_key, 0) + 1
        
        f.write("| Padrão | Quantidade |\n")
        f.write("|--------|------------|\n")
        for pattern, count in sorted(pattern_types.items(), key=lambda x: x[1], reverse=True):
            f.write(f"| `{pattern}` | {count} |\n")
        f.write("\n---\n\n")
        
        # Lista de views com padrões
        f.write("## 📋 Views com Padrões Identificados\n\n")
        
        for view_data in views_with_patterns:
            schema_name = view_data['schema']
            view_name = view_data['view']
            patterns = view_data['enum_patterns']
            
            f.write(f"### {schema_name}.{view_name}\n\n")
            f.write(f"**Total de colunas**: {view_data['total_columns']}\n\n")
            f.write(f"**Padrões encontrados**: {len(patterns)}\n\n")
            
            f.write("| Campo Enum | Tipo | Campo Descrição | Tipo | Padrão |\n")
            f.write("|------------|------|-----------------|------|--------|\n")
            
            for pattern in patterns:
                f.write(f"| `{pattern['enum_field']}` | `{pattern['enum_type']}` | ")
                f.write(f"`{pattern['desc_field']}` | `{pattern['desc_type']}` | ")
                f.write(f"`{pattern['pattern']}` |\n")
            
            f.write("\n")
        
        f.write("---\n\n")
        
        # Campos enum mais comuns
        f.write("## 🎯 Campos Enum Mais Comuns\n\n")
        
        enum_fields = {}
        for pattern in self.enum_patterns:
            field = pattern['enum_field']
            enum_fields[field] = enum_fields.get(field, 0) + 1
        
        f.write("| Campo | Ocorrências |\n")
        f.write("|-------|-------------|\n")
        
        for field, count in sorted(enum_fields.items(), key=lambda x: x[1], reverse=True)[:20]:
            f.write(f"| `{field}` | {count} |\n")
        
        f.write("\n---\n\n")
        
        # Próximos passos
        f.write("## 🚀 Próximos Passos\n\n")
        f.write("1. **Executar** o script `extract_enum_meanings.py` para extrair os valores\n")
        f.write("2. **Revisar** os mapeamentos extraídos\n")
        f.write("3. **Validar** com a equipe da FinanBlue\n")
        f.write("4. **Atualizar** as queries do dashboard\n\n")
        
        # Referências
        f.write("---\n\n")
        f.write("## 📚 Arquivos Gerados\n\n")
        f.write(f"- **Metadados JSON**: `{self.output_dir}/view_analysis_metadata.json`\n")
        f.write(f"- **Queries SQL**: `{self.output_dir}/extract_enum_mappings.sql`\n")
        f.write(f"- **Este relatório**: `{self.output_dir}/ENUM_PATTERNS_REPORT.md`\n\n")


def main():
    """Função principal"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Analisa views do banco de dados para identificar padrões de enum+descrição'
    )
    parser.add_argument(
        '--output',
        '-o',
        default='#analysis/views_analysis',
        help='Diretório de saída para os resultados'
    )
    
    args = parser.parse_args()
    
    analyzer = ViewColumnAnalyzer(output_dir=args.output)
    analyzer.analyze_all_views()


if __name__ == '__main__':
    main()
