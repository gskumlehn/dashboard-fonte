import os
import pyodbc  # Importação explícita para evitar erro "name 'pyodbc' is not defined"

class Database:
    def __init__(self):
        self.server = os.getenv("DB_SERVER")
        self.port = os.getenv("DB_PORT")
        self.database = os.getenv("DB_NAME")
        self.username = os.getenv("DB_USER")
        self.password = os.getenv("DB_PASSWORD")
        self.driver = os.getenv("DB_DRIVER", "ODBC Driver 18 for SQL Server")
        self.tds_version = os.getenv("TDS_VERSION")
        self.connection = None

    def connect(self):

        connection_string = (
            f"DRIVER={{{self.driver}}};"
            f"SERVER={self.server};"
            f"PORT={self.port};"
            f"DATABASE={self.database};"
            f"UID={self.username};"
            f"PWD={self.password};"
            f"TDS_Version={self.tds_version};"
            f"Encrypt=yes;"
            f"TrustServerCertificate=no;"
        )
        try:
            self.connection = pyodbc.connect(connection_string)
        except pyodbc.Error as e:
            raise ConnectionError(f"Erro ao conectar ao banco de dados: {e}")

    def get_connection(self):
        if self.connection is None:
            self.connect()
        return self.connection

    def close_connection(self):
        if self.connection:
            self.connection.close()
            self.connection = None

    def execute_query(self, query, params=None):
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            return cursor.fetchall()
        except pyodbc.Error as e:
            raise RuntimeError(f"Erro ao executar a query: {e}")
        finally:
            try:
                cursor.close()
            except Exception:
                pass