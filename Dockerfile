FROM python:3.10-slim

ENV ACCEPT_EULA=Y

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    unixodbc \
    unixodbc-dev \
    freetds-bin \
    freetds-dev \
    curl \
    gnupg \
    ca-certificates \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/debian/11/prod bullseye main" > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update && ACCEPT_EULA=Y apt-get install -y msodbcsql18 \
    && rm -rf /var/lib/apt/lists/*

# Configuração do FreeTDS no unixODBC para ARM64
RUN echo "[FreeTDS]\n\
Description = FreeTDS Driver\n\
Driver = /usr/lib/aarch64-linux-gnu/odbc/libtdsodbc.so\n\
Setup = /usr/lib/aarch64-linux-gnu/odbc/libtdsS.so\n\
FileUsage = 1" > /etc/odbcinst.ini

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["gunicorn", "wsgi:app", "--bind", "0.0.0.0:5000"]