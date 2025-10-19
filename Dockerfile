FROM python:3.10-slim

WORKDIR /app

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    curl \
    apt-transport-https \
    gnupg && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Define variáveis de ambiente padrão
ENV PORT=5000

# Instala dependências Python
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

EXPOSE 5000
# Comando para rodar o Gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "wsgi:app"]
