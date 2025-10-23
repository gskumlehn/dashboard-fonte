import logging
import logging.handlers
import os
import sys
import time
from dotenv import load_dotenv, find_dotenv

from app.services.comercial_service import ComercialService

LOG_DIR = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'churn_test.log')

def setup_logging():
    logger = logging.getLogger('run_churn_test')
    logger.setLevel(logging.INFO)

    # Console handler
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch_formatter = logging.Formatter('%(asctime)s [%(levelname)s] - %(message)s')
    ch.setFormatter(ch_formatter)

    # File handler (rotating)
    fh = logging.handlers.RotatingFileHandler(LOG_FILE, maxBytes=2_000_000, backupCount=3, encoding='utf-8')
    fh.setLevel(logging.INFO)
    fh.setFormatter(ch_formatter)

    if not logger.handlers:
        logger.addHandler(ch)
        logger.addHandler(fh)

    return logger

logger = setup_logging()

# Carrega .env (se existir), modo simples
ENV_PATH = find_dotenv()
if ENV_PATH:
    load_dotenv(ENV_PATH)
    logger.debug(f".env carregado: {ENV_PATH}")
else:
    logger.debug(".env não encontrado")

def test_get_churn_data():
    """Fluxo simplificado: chama get_churn_data() e registra tempo e contagem."""
    logger.info("Iniciando busca de churn data")
    start = time.time()
    try:
        data = ComercialService.get_churn_data()
        elapsed = time.time() - start
        if data is None:
            logger.warning("get_churn_data retornou None")
            return None

        # Tentar obter tamanho/contagem
        try:
            count = len(data)
        except Exception:
            count = None

        logger.info(f"Busca concluída em {elapsed:.3f}s; registros encontrados: {count if count is not None else 'desconhecido'}")

        # Logar pequena amostra (até 5 itens) para verificação rápida
        try:
            sample_limit = 5
            if hasattr(data, '__iter__'):
                for i, item in enumerate(data):
                    if i >= sample_limit:
                        break
                    logger.info(f"amostra[{i}]: {repr(item)}")
        except Exception:
            logger.exception("Erro ao extrair amostra dos resultados")

        return data

    except Exception:
        logger.exception("Erro ao executar get_churn_data")
        return None

if __name__ == '__main__':
    result = test_get_churn_data()
    if result is None:
        logger.error("Teste finalizado com erro")
        sys.exit(1)
    logger.info("Teste finalizado com sucesso")
    sys.exit(0)
