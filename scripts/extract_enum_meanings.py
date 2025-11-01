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
from datetime import datetime
import json
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.infra.db_connection import Database


class EnumMeaningExtractor:
    def __init__(self, analysis_dir='#analysis/views_analysis', output_dir='#analysis/enum_meanings'):
        self.analysis_dir = os.path.abspath(analysis_dir)
        self.output_dir = os.path.abspath(output_dir)
        self.db = Database()
        self.enum_mappings = {}
        self.errors = []

    def create_output_directory(self):
        os.makedirs(self.output_dir, exist_ok=True)

    def load_analysis_metadata(self):
        metadata_file = os.path.join(self.analysis_dir, 'view_analysis_metadata.json')
        if not os.path.exists(metadata_file):
            return None
        with open(metadata_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def extract_enum_mapping(self, schema_name, view_name, enum_field, desc_field):
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
            return self.db.execute_query(query)
        except Exception as e:
            return None

    def extract_all_enum_meanings(self):
        metadata = self.load_analysis_metadata()
        if not metadata:
            return
        self.create_output_directory()
        views_with_patterns = [v for v in metadata['views'] if v.get('enum_patterns')]
        if not views_with_patterns:
            return
        with tqdm(total=sum(len(v['enum_patterns']) for v in views_with_patterns), desc="Extraindo enums", unit="enum") as pbar:
            for view_data in views_with_patterns:
                schema_name = view_data['schema']
                view_name = view_data['view']
                for pattern in view_data['enum_patterns']:
                    enum_field = pattern['enum_field']
                    desc_field = pattern['desc_field']
                    mapping = self.extract_enum_mapping(schema_name, view_name, enum_field, desc_field)
                    if mapping:
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
        self.generate_reports()
        self.db.close_connection()

    def generate_reports(self):
        json_file = os.path.join(self.output_dir, 'enum_mappings.json')
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump({
                'extraction_date': datetime.now().isoformat(),
                'total_enums': len(self.enum_mappings),
                'total_errors': len(self.errors),
                'mappings': self.enum_mappings,
                'errors': self.errors
            }, f, indent=2, ensure_ascii=False)

def main():
    extractor = EnumMeaningExtractor(
        analysis_dir='#analysis/views_analysis',
        output_dir='#analysis/enum_meanings'
    )
    extractor.extract_all_enum_meanings()

if __name__ == '__main__':
    main()
