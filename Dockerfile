FROM python:3.10-slim

ENV ACCEPT_EULA=Y

# 1. Instalação e Configuração dos Drivers ODBC (FreeTDS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    unixodbc \
    unixodbc-dev \
    freetds-bin \
    freetds-dev \
    tdsodbc \
    && rm -rf /var/lib/apt/lists/*

# Configuração do FreeTDS no unixODBC (odbcinst.ini)
# Este caminho (/usr/lib/aarch64-linux-gnu/odbc/libtdsodbc.so) é o correto
# para a arquitetura 64-bit do Raspberry Pi OS.
RUN echo "[FreeTDS]\n\
Description = FreeTDS Driver\n\
Driver = /usr/lib/aarch64-linux-gnu/odbc/libtdsodbc.so\n\
Setup = /usr/lib/aarch64-linux-gnu/odbc/libtdsS.so\n\
FileUsage = 1" > /etc/odbcinst.ini

COPY freetds.conf /etc/freetds/freetds.conf

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt pyodbc

COPY . .

CMD ["gunicorn", "wsgi:app", "--bind", "0.0.0.0:5000"]