#!/usr/bin/env python3
"""
Script para executar queries e extrair significados dos enums

Este script:
1. Lê o arquivo view_analysis_metadata.json
2. Executa as queries SQL para cada padrão de enum encontrado
3. Gera documento ENUMS_DESCOBERTOS.md com todos os mapeamentos

Autor: Dashboard Fonte Team
Data: 31 de outubro de 2025
Versão: 1.0
"""

import sys
import os
from pathlib import Path
from datetime import datetime
import json
from tqdm import tqdm

# Adiciona o diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.infra.db_connection import Database


class EnumMeaningExtractor:
    """Extrator de significados de enums das views"""
    
    def __init__(self, analysis_dir='./data/view_analysis', output_dir='./data/enum_meanings'):
        """
        Inicializa o extrator
        
        Args:
            analysis_dir (str): Diretório com os resultados da análise de views
            output_dir (str): Diretório onde os resultados serão salvos
        """
        self.analysis_dir = Path(analysis_dir)
        self.output_dir = Path(output_dir)
        self.db = Database()
        self.enum_mappings = {}
        self.errors = []
        
    def create_output_directory(self):
        """Cria o diretório de saída se não existir"""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        print(f"📁 Diretório de saída: {self.output_dir.absolute()}")
        
    def load_analysis_metadata(self):
        """
        Carrega o arquivo de metadados da análise de views
        
        Returns:
            dict: Metadados da análise ou None se não encontrado
        """
        metadata_file = self.analysis_dir / 'view_analysis_metadata.json'
        
        if not metadata_file.exists():
            print(f"❌ Arquivo de metadados não encontrado: {metadata_file}")
            print(f"⚠️  Execute primeiro: python scripts/analyze_view_columns.py")
            return None
        
        try:
            with open(metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            print(f"✅ Metadados carregados: {metadata_file}")
            print(f"   - Views analisadas: {metadata['total_views_analyzed']}")
            print(f"   - Views com padrões: {metadata['views_with_patterns']}")
            print(f"   - Pares enum+descrição: {metadata['total_enum_candidates']}")
            
            return metadata
        except Exception as e:
            print(f"❌ Erro ao carregar metadados: {e}")
            return None
    
    def extract_enum_mapping(self, schema_name, view_name, enum_field, desc_field):
        """
        Executa query para extrair mapeamento de enum
        
        Args:
            schema_name (str): Nome do schema
            view_name (str): Nome da view
            enum_field (str): Nome do campo enum
            desc_field (str): Nome do campo descrição
            
        Returns:
            list: Lista de tuplas (valor_enum, descrição, quantidade)
        """
        query = f"""
            SELECT DISTINCT
                {enum_field} AS Valor,
                {desc_field} AS Descricao,
                COUNT(*) AS Quantidade
            FROM {schema_name}.{view_name}
            WHERE {enum_field} IS NOT NULL
              AND {desc_field} IS NOT NULL
            GROUP BY {enum_field}, {desc_field}
            ORDER BY {enum_field};
        """
        
        try:
            results = self.db.execute_query(query)
            return results
        except Exception as e:
            print(f"❌ Erro ao extrair {enum_field} de {schema_name}.{view_name}: {e}")
            return None
    
    def extract_all_enum_meanings(self):
        """Extrai significados de todos os enums encontrados"""
        print("\n" + "=" * 80)
        print("🔍 EXTRATOR DE SIGNIFICADOS DE ENUMS")
        print("=" * 80)
        
        # Carrega metadados
        metadata = self.load_analysis_metadata()
        if not metadata:
            return
        
        # Cria diretório de saída
        self.create_output_directory()
        
        # Processa cada view com padrões
        views_with_patterns = [v for v in metadata['views'] if v.get('enum_patterns')]
        
        if not views_with_patterns:
            print("\n⚠️  Nenhum padrão de enum encontrado na análise.")
            print("   Execute: python scripts/analyze_view_columns.py")
            return
        
        print(f"\n📊 Processando {len(views_with_patterns)} views com padrões de enum...\n")
        
        total_patterns = sum(len(v['enum_patterns']) for v in views_with_patterns)
        
        with tqdm(total=total_patterns, desc="Extraindo enums", unit="enum") as pbar:
            for view_data in views_with_patterns:
                schema_name = view_data['schema']
                view_name = view_data['view']
                
                for pattern in view_data['enum_patterns']:
                    enum_field = pattern['enum_field']
                    desc_field = pattern['desc_field']
                    
                    # Extrai mapeamento
                    mapping = self.extract_enum_mapping(
                        schema_name,
                        view_name,
                        enum_field,
                        desc_field
                    )
                    
                    if mapping:
                        # Cria chave única para o enum
                        enum_key = f"{schema_name}.{view_name}.{enum_field}"
                        
                        self.enum_mappings[enum_key] = {
                            'schema': schema_name,
                            'view': view_name,
                            'enum_field': enum_field,
                            'enum_type': pattern['enum_type'],
                            'desc_field': desc_field,
                            'desc_type': pattern['desc_type'],
                            'pattern': pattern['pattern'],
                            'values': [
                                {
                                    'valor': row[0],
                                    'descricao': row[1],
                                    'quantidade': row[2]
                                }
                                for row in mapping
                            ]
                        }
                    else:
                        self.errors.append({
                            'view': f"{schema_name}.{view_name}",
                            'enum_field': enum_field,
                            'error': 'Falha ao extrair mapeamento'
                        })
                    
                    pbar.update(1)
        
        # Gera relatórios
        self.generate_reports()
        
        # Fecha conexão
        self.db.close_connection()
    
    def generate_reports(self):
        """Gera relatórios com os enums descobertos"""
        print("\n" + "=" * 80)
        print("📊 RESUMO DA EXTRAÇÃO")
        print("=" * 80)
        print(f"✅ Enums extraídos com sucesso: {len(self.enum_mappings)}")
        print(f"❌ Erros: {len(self.errors)}")
        print("=" * 80)
        
        # 1. Salva mapeamentos em JSON
        json_file = self.output_dir / 'enum_mappings.json'
        try:
            output_data = {
                'extraction_date': datetime.now().isoformat(),
                'total_enums': len(self.enum_mappings),
                'total_errors': len(self.errors),
                'mappings': self.enum_mappings,
                'errors': self.errors
            }
            
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            print(f"\n📄 Mapeamentos JSON salvos em: {json_file}")
        except Exception as e:
            print(f"\n❌ Erro ao salvar JSON: {e}")
        
        # 2. Gera documento Markdown
        md_file = self.output_dir / 'ENUMS_DESCOBERTOS.md'
        try:
            with open(md_file, 'w', encoding='utf-8') as f:
                self._write_markdown_report(f)
            
            print(f"📄 Documento Markdown salvo em: {md_file}")
        except Exception as e:
            print(f"❌ Erro ao salvar Markdown: {e}")
        
        # 3. Gera arquivo Python com constantes
        py_file = self.output_dir / 'enum_constants.py'
        try:
            with open(py_file, 'w', encoding='utf-8') as f:
                self._write_python_constants(f)
            
            print(f"📄 Constantes Python salvas em: {py_file}")
        except Exception as e:
            print(f"❌ Erro ao salvar Python: {e}")
        
        print("\n✅ Extração concluída!\n")
    
    def _write_markdown_report(self, f):
        """Escreve relatório Markdown completo"""
        f.write("# Enums Descobertos - LiveWork Database\n\n")
        f.write(f"**Data da Extração**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("---\n\n")
        
        f.write("## 📊 Resumo\n\n")
        f.write(f"- **Total de enums descobertos**: {len(self.enum_mappings)}\n")
        f.write(f"- **Total de valores únicos**: {sum(len(m['values']) for m in self.enum_mappings.values())}\n\n")
        
        if self.errors:
            f.write(f"- ⚠️ **Erros durante extração**: {len(self.errors)}\n\n")
        
        f.write("---\n\n")
        
        # Agrupa por campo enum (sem schema.view)
        enum_groups = {}
        for enum_key, mapping in self.enum_mappings.items():
            field_name = mapping['enum_field']
            if field_name not in enum_groups:
                enum_groups[field_name] = []
            enum_groups[field_name].append(mapping)
        
        f.write("## 🎯 Índice de Enums\n\n")
        for field_name in sorted(enum_groups.keys()):
            f.write(f"- [{field_name}](#{field_name.lower()})\n")
        f.write("\n---\n\n")
        
        # Detalhamento de cada enum
        f.write("## 📋 Detalhamento dos Enums\n\n")
        
        for field_name in sorted(enum_groups.keys()):
            mappings = enum_groups[field_name]
            
            f.write(f"### {field_name}\n\n")
            
            # Se houver múltiplas views com o mesmo campo
            if len(mappings) > 1:
                f.write(f"**Encontrado em {len(mappings)} views**:\n\n")
                for m in mappings:
                    f.write(f"- `{m['schema']}.{m['view']}`\n")
                f.write("\n")
            else:
                m = mappings[0]
                f.write(f"**Fonte**: `{m['schema']}.{m['view']}`\n\n")
            
            # Usa a primeira ocorrência para os valores
            main_mapping = mappings[0]
            
            f.write(f"**Tipo**: `{main_mapping['enum_type']}`\n\n")
            
            # Tabela de valores
            f.write("| Valor | Descrição | Quantidade |\n")
            f.write("|-------|-----------|------------|\n")
            
            for value in main_mapping['values']:
                valor = value['valor'] if value['valor'] is not None else 'NULL'
                descricao = value['descricao'] if value['descricao'] else '-'
                quantidade = f"{value['quantidade']:,}"
                f.write(f"| `{valor}` | {descricao} | {quantidade} |\n")
            
            f.write("\n")
            
            # Exemplo de uso em SQL
            f.write("**Exemplo de uso em SQL**:\n\n")
            f.write("```sql\n")
            f.write(f"-- Filtrar por valor específico\n")
            first_value = main_mapping['values'][0]['valor'] if main_mapping['values'] else 0
            first_desc = main_mapping['values'][0]['descricao'] if main_mapping['values'] else 'Descrição'
            f.write(f"WHERE {field_name} = {first_value}  -- {first_desc}\n\n")
            
            if len(main_mapping['values']) > 1:
                f.write(f"-- Filtrar por múltiplos valores\n")
                values_list = ', '.join(str(v['valor']) for v in main_mapping['values'][:3])
                f.write(f"WHERE {field_name} IN ({values_list})\n")
            f.write("```\n\n")
            
            f.write("---\n\n")
        
        # Seção de erros (se houver)
        if self.errors:
            f.write("## ⚠️ Erros Durante Extração\n\n")
            f.write("| View | Campo | Erro |\n")
            f.write("|------|-------|------|\n")
            for error in self.errors:
                f.write(f"| `{error['view']}` | `{error['enum_field']}` | {error['error']} |\n")
            f.write("\n---\n\n")
        
        # Próximos passos
        f.write("## 🚀 Próximos Passos\n\n")
        f.write("1. **Validar** os valores com a equipe da FinanBlue\n")
        f.write("2. **Atualizar** as queries do dashboard com os valores corretos\n")
        f.write("3. **Testar** os KPIs com dados reais\n")
        f.write("4. **Documentar** regras de negócio específicas\n\n")
        
        # Referências
        f.write("---\n\n")
        f.write("## 📚 Referências\n\n")
        f.write(f"- **Análise de Views**: `{self.analysis_dir}/ENUM_PATTERNS_REPORT.md`\n")
        f.write(f"- **Queries SQL**: `{self.analysis_dir}/extract_enum_mappings.sql`\n")
        f.write(f"- **Mapeamentos JSON**: `{self.output_dir}/enum_mappings.json`\n")
        f.write(f"- **Constantes Python**: `{self.output_dir}/enum_constants.py`\n\n")
    
    def _write_python_constants(self, f):
        """Gera arquivo Python com constantes de enum"""
        f.write('"""\n')
        f.write('Constantes de Enum - LiveWork Database\n\n')
        f.write(f'Gerado automaticamente em: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')
        f.write('NÃO EDITE MANUALMENTE - Execute extract_enum_meanings.py para atualizar\n')
        f.write('"""\n\n')
        
        # Agrupa por campo enum
        enum_groups = {}
        for enum_key, mapping in self.enum_mappings.items():
            field_name = mapping['enum_field']
            if field_name not in enum_groups:
                enum_groups[field_name] = mapping
        
        # Gera classes de enum
        for field_name in sorted(enum_groups.keys()):
            mapping = enum_groups[field_name]
            
            class_name = ''.join(word.capitalize() for word in field_name.split('_'))
            
            f.write(f"\nclass {class_name}:\n")
            f.write(f'    """{field_name} - Valores possíveis"""\n')
            f.write(f'    # Fonte: {mapping["schema"]}.{mapping["view"]}\n')
            f.write(f'    # Tipo: {mapping["enum_type"]}\n\n')
            
            for value in mapping['values']:
                valor = value['valor']
                descricao = value['descricao']
                
                # Cria nome de constante válido
                const_name = descricao.upper().replace(' ', '_').replace('/', '_').replace('-', '_')
                const_name = ''.join(c for c in const_name if c.isalnum() or c == '_')
                
                f.write(f'    {const_name} = {valor}  # {descricao}\n')
            
            f.write('\n')
            
            # Gera dicionário de lookup
            f.write(f'    _DESCRIPTIONS = {{\n')
            for value in mapping['values']:
                valor = value['valor']
                descricao = value['descricao']
                f.write(f'        {valor}: "{descricao}",\n')
            f.write('    }\n\n')
            
            # Gera método de lookup
            f.write('    @classmethod\n')
            f.write('    def get_description(cls, value):\n')
            f.write('        """Retorna a descrição do valor do enum"""\n')
            f.write('        return cls._DESCRIPTIONS.get(value, "Desconhecido")\n')
            
            f.write('\n')


def main():
    """Função principal"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Extrai significados de enums das views analisadas'
    )
    parser.add_argument(
        '--analysis-dir',
        '-a',
        default='./data/view_analysis',
        help='Diretório com os resultados da análise de views'
    )
    parser.add_argument(
        '--output',
        '-o',
        default='./data/enum_meanings',
        help='Diretório de saída para os resultados'
    )
    
    args = parser.parse_args()
    
    extractor = EnumMeaningExtractor(
        analysis_dir=args.analysis_dir,
        output_dir=args.output
    )
    extractor.extract_all_enum_meanings()


if __name__ == '__main__':
    main()

