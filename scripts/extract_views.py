import sys
import os
from datetime import datetime
from tqdm import tqdm
import json

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from app.infra.db_connection import Database


class ViewExtractor:
    def __init__(self, output_dir='analisys/views'):
        self.output_dir = output_dir
        self.output_dir_abs = os.path.abspath(self.output_dir)
        self.db = Database()
        self.views_extracted = []
        self.errors = []
        print(f"Initialized ViewExtractor with output directory: {self.output_dir_abs}")

    def create_output_directory(self):
        try:
            os.makedirs(self.output_dir_abs, exist_ok=True)
            print(f"Output directory created or already exists: {self.output_dir_abs}")
        except Exception as e:
            print(f"Error creating output directory: {e}")

    def get_all_views(self):
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
            print(f"Fetched {len(results)} views from the database.")
            return results
        except Exception as e:
            print(f"Error fetching views: {e}")
            return []

    def get_view_definition(self, schema_name, view_name):
        query = """
            SELECT OBJECT_DEFINITION(OBJECT_ID(?))
        """
        full_view_name = f"{schema_name}.{view_name}"
        try:
            results = self.db.execute_query(query, (full_view_name,))
            if results and len(results) > 0 and results[0][0]:
                print(f"Fetched definition for view: {full_view_name}")
                return results[0][0]
            else:
                print(f"No definition found for view: {full_view_name}")
                return None
        except Exception as e:
            print(f"Error fetching definition for view {full_view_name}: {e}")
            return None

    def get_view_columns(self, schema_name, view_name):
        query = """
            SELECT 
                c.name AS ColumnName,
                t.name AS DataType,
                c.max_length AS MaxLength,
                c.precision AS Precision,
                c.scale AS Scale,
                c.is_nullable AS IsNullable
            FROM sys.views v
            INNER JOIN sys.columns c ON v.object_id = c.object_id
            INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
            WHERE SCHEMA_NAME(v.schema_id) = ?
              AND v.name = ?
            ORDER BY c.column_id;
        """
        try:
            results = self.db.execute_query(query, (schema_name, view_name))
            print(f"Fetched {len(results)} columns for view: {schema_name}.{view_name}")
            return results
        except Exception as e:
            print(f"Error fetching columns for view {schema_name}.{view_name}: {e}")
            return []

    def save_view_to_file(self, schema_name, view_name, definition, columns, create_date, modify_date):
        filename = f"{schema_name}_{view_name}.sql"
        filepath = os.path.join(self.output_dir_abs, filename)
        content = []
        content.append("-- " + "=" * 78)
        content.append(f"-- VIEW: {schema_name}.{view_name}")
        content.append("-- " + "=" * 78)
        content.append(f"-- Data de Criação: {create_date}")
        content.append(f"-- Data de Modificação: {modify_date}")
        content.append(f"-- Extraído em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        content.append("-- " + "=" * 78)
        content.append("")
        if columns:
            content.append("-- COLUNAS:")
            content.append("-- " + "-" * 78)
            for col in columns:
                col_name = col[0]
                data_type = col[1]
                max_length = col[2] if col[2] != -1 else 'MAX'
                precision = col[3]
                scale = col[4]
                is_nullable = 'NULL' if col[5] else 'NOT NULL'
                if data_type in ['varchar', 'nvarchar', 'char', 'nchar']:
                    type_desc = f"{data_type}({max_length})"
                elif data_type in ['decimal', 'numeric']:
                    type_desc = f"{data_type}({precision}, {scale})"
                else:
                    type_desc = data_type
                content.append(f"--   • {col_name:40} {type_desc:20} {is_nullable}")
            content.append("-- " + "-" * 78)
            content.append("")
        content.append("-- DEFINIÇÃO:")
        content.append("-- " + "=" * 78)
        content.append("")
        content.append(definition)
        content.append("")
        content.append("-- " + "=" * 78)
        content.append("-- FIM DA VIEW")
        content.append("-- " + "=" * 78)
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write('\n'.join(content))
            print(f"Saved view to file: {filepath}")
            return True
        except Exception as e:
            print(f"Error saving view to file {filename}: {e}")
            return False

    def extract_all_views(self):
        views = self.get_all_views()
        if not views:
            print("No views found or error fetching views.")
            return
        total_views = len(views)
        print(f"Total views to process: {total_views}")
        self.create_output_directory()
        for view_info in tqdm(views, desc="Extracting views", unit="view"):
            schema_name = view_info[0]
            view_name = view_info[1]
            create_date = view_info[2]
            modify_date = view_info[3]
            definition = self.get_view_definition(schema_name, view_name)
            if definition:
                columns = self.get_view_columns(schema_name, view_name)
                success = self.save_view_to_file(
                    schema_name,
                    view_name,
                    definition,
                    columns,
                    create_date,
                    modify_date
                )
                if success:
                    self.views_extracted.append({
                        'schema': schema_name,
                        'view': view_name,
                        'file': f"{schema_name}_{view_name}.sql",
                        'columns': len(columns),
                        'create_date': create_date.isoformat() if create_date else None,
                        'modify_date': modify_date.isoformat() if modify_date else None
                    })
                else:
                    self.errors.append({
                        'view': f"{schema_name}.{view_name}",
                        'error': 'Error saving file'
                    })
            else:
                self.errors.append({
                    'view': f"{schema_name}.{view_name}",
                    'error': 'Definition not found or empty'
                })
        self.generate_report()
        self.db.close_connection()

    def generate_report(self):
        print("Generating extraction report...")
        metadata = {
            'extraction_date': datetime.now().isoformat(),
            'total_views': len(self.views_extracted) + len(self.errors),
            'success_count': len(self.views_extracted),
            'error_count': len(self.errors),
            'views': self.views_extracted,
            'errors': self.errors
        }
        metadata_file = os.path.join(self.output_dir_abs, 'extraction_metadata.json')
        try:
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            print(f"Metadata saved to: {metadata_file}")
        except Exception as e:
            print(f"Error saving metadata: {e}")

    def search_in_views(self, search_term):
        print(f"Searching for term: {search_term}")
        matches = []
        try:
            for filename in os.listdir(self.output_dir_abs):
                if not filename.lower().endswith('.sql'):
                    continue
                filepath = os.path.join(self.output_dir_abs, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if search_term.lower() in content.lower():
                            count = content.lower().count(search_term.lower())
                            matches.append((filename, count))
                except Exception as e:
                    print(f"Error reading file {filename}: {e}")
        except FileNotFoundError:
            print(f"Output directory not found: {self.output_dir_abs}")
            return
        if matches:
            print(f"Found matches in {len(matches)} views.")
            for view_file, count in sorted(matches, key=lambda x: x[1], reverse=True):
                print(f"  {view_file}: {count} occurrences")
        else:
            print("No matches found.")

def main():
    print("Starting view extraction...")
    extractor = ViewExtractor()
    extractor.extract_all_views()
    print("View extraction completed.")

if __name__ == '__main__':
    main()
