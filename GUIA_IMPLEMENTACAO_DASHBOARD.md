# 🚀 Guia Rápido de Implementação - Dashboard Fonte

**Data**: 1 de novembro de 2025  
**Versão**: 1.0  
**Status**: ✅ Pronto para Desenvolvimento

---

## 📋 Visão Geral

Este guia fornece um roteiro passo a passo para implementar o dashboard da Fonte Inc seguindo a especificação técnica completa.

**Documento de referência**: `docs/DASHBOARD_SPECIFICATION_FINAL.md`

---

## 🎯 Ordem de Implementação Recomendada

### Fase 1: Setup Inicial (1 dia)

#### 1.1 Configurar Ambiente

```bash
# Clonar repositório
git clone https://github.com/gskumlehn/dashboard-fonte.git
cd dashboard-fonte

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt
```

#### 1.2 Configurar Banco de Dados

```python
# app/config.py
import os

class Config:
    # SQL Server Connection
    SQLSERVER_HOST = os.getenv('DB_HOST', 'localhost')
    SQLSERVER_PORT = os.getenv('DB_PORT', '1433')
    SQLSERVER_DATABASE = os.getenv('DB_NAME', 'livework_fonte')
    SQLSERVER_USER = os.getenv('DB_USER', 'sa')
    SQLSERVER_PASSWORD = os.getenv('DB_PASSWORD', '')
    
    # SQLAlchemy URI
    SQLALCHEMY_DATABASE_URI = (
        f"mssql+pyodbc://{SQLSERVER_USER}:{SQLSERVER_PASSWORD}@"
        f"{SQLSERVER_HOST}:{SQLSERVER_PORT}/{SQLSERVER_DATABASE}"
        f"?driver=ODBC+Driver+17+for+SQL+Server"
    )
    
    # Flask Config
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
```

#### 1.3 Testar Conexão

```python
# test_connection.py
from app.infra.db_connection import Database

db = Database()
result = db.execute_query("SELECT COUNT(*) as total FROM Operacao WHERE IsDeleted = 0")
print(f"Total de operações: {result[0]['total']}")
```

---

### Fase 2: Tela 1 - Visão Executiva (2-3 dias)

**Prioridade**: 🔴 Crítica

#### 2.1 Implementar KPI 1.1: Volume de Operações

**Backend**:
```python
# app/services/kpi_service.py
from sqlalchemy import text
from app.constants.enums import OperacaoStatus, IsDeleted

class KPIService:
    def get_volume_operacoes(self, start_date, end_date):
        query = text("""
            SELECT 
                COUNT(o.Id) as total_operations,
                SUM(o.ValorCompra) as total_value,
                AVG(o.ValorCompra) as average_ticket
            FROM Operacao o
            WHERE o.Status = :status
              AND o.IsDeleted = :is_deleted
              AND o.Data BETWEEN :start_date AND :end_date
        """)
        
        params = {
            'status': OperacaoStatus.FECHADO,
            'is_deleted': IsDeleted.ATIVO,
            'start_date': start_date,
            'end_date': end_date
        }
        
        return self.db.execute_query(query, params)[0]
```

**Rota**:
```python
# app/routes/kpi_routes.py
@kpi_bp.route('/volume-operacoes', methods=['GET'])
def get_volume_operacoes():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    result = kpi_service.get_volume_operacoes(start_date, end_date)
    
    return jsonify({
        'success': True,
        'data': result
    })
```

**Frontend**:
```html
<!-- templates/dashboard/visao_executiva.html -->
<div class="row">
    <div class="col-md-4">
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Volume de Operações</h5>
                <h2 id="total_operations">-</h2>
                <p class="text-muted">operações fechadas</p>
                <h3 id="total_value">R$ -</h3>
                <p class="text-muted">valor total</p>
            </div>
        </div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-md-12">
        <canvas id="volumeChart"></canvas>
    </div>
</div>
```

```javascript
// static/js/visao_executiva.js
async function loadVolumeOperacoes() {
    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;
    
    const response = await fetch(
        `/api/kpi/volume-operacoes?start_date=${startDate}&end_date=${endDate}`
    );
    const data = await response.json();
    
    if (data.success) {
        document.getElementById('total_operations').textContent = 
            data.data.total_operations.toLocaleString('pt-BR');
        document.getElementById('total_value').textContent = 
            'R$ ' + data.data.total_value.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        
        updateVolumeChart(data.data);
    }
}
```

#### 2.2 Implementar KPI 1.2: Taxa de Inadimplência

**Backend**:
```python
def get_taxa_inadimplencia(self):
    query = text("""
        SELECT 
            COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) as overdue_count,
            COUNT(*) as total_count,
            CAST(COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) AS FLOAT) * 100.0 / 
                NULLIF(COUNT(*), 0) as default_rate
        FROM ViewDocumentoAtrasoCalculo v
        WHERE v.IsDeleted = :is_deleted
    """)
    
    params = {'is_deleted': IsDeleted.ATIVO}
    
    return self.db.execute_query(query, params)[0]
```

#### 2.3 Implementar KPI 1.3: ROI

**Backend**:
```python
def get_roi(self, start_date, end_date):
    query = text("""
        SELECT 
            SUM(o.ValorCompra) as invested_value,
            SUM(o.ValorFace) as received_value,
            (SUM(o.ValorFace) - SUM(o.ValorCompra)) as profit,
            CAST((SUM(o.ValorFace) - SUM(o.ValorCompra)) AS FLOAT) * 100.0 / 
                NULLIF(SUM(o.ValorCompra), 0) as roi_percent
        FROM Operacao o
        WHERE o.Status = :status
          AND o.IsDeleted = :is_deleted
          AND o.Data BETWEEN :start_date AND :end_date
    """)
    
    params = {
        'status': OperacaoStatus.FECHADO,
        'is_deleted': IsDeleted.ATIVO,
        'start_date': start_date,
        'end_date': end_date
    }
    
    return self.db.execute_query(query, params)[0]
```

#### 2.4 Implementar KPI 1.4: Ticket Médio

**Backend**:
```python
def get_ticket_medio(self, start_date, end_date):
    query = text("""
        SELECT 
            AVG(o.ValorCompra) as average_ticket,
            MIN(o.ValorCompra) as min_ticket,
            MAX(o.ValorCompra) as max_ticket,
            STDEV(o.ValorCompra) as std_deviation
        FROM Operacao o
        WHERE o.Status = :status
          AND o.IsDeleted = :is_deleted
          AND o.Data BETWEEN :start_date AND :end_date
    """)
    
    params = {
        'status': OperacaoStatus.FECHADO,
        'is_deleted': IsDeleted.ATIVO,
        'start_date': start_date,
        'end_date': end_date
    }
    
    return self.db.execute_query(query, params)[0]
```

---

### Fase 3: Tela 2 - Análise de Clientes (3-4 dias)

**Prioridade**: 🔴 Crítica

#### 3.1 Implementar KPI 2.1: Ranking de Clientes

**Backend**:
```python
def get_ranking_clientes(self, start_date, end_date, limit=20):
    query = text("""
        SELECT 
            cb.Id as client_id,
            cb.Razao as client_name,
            cb.Email as client_email,
            COUNT(DISTINCT o.Id) as operation_count,
            SUM(o.ValorCompra) as total_volume,
            AVG(o.ValorCompra) as average_ticket,
            MAX(o.Data) as last_operation_date
        FROM CadastroBase cb
        INNER JOIN Operacao o ON cb.Id = o.ClienteId
        WHERE o.Status = :status
          AND o.IsDeleted = :is_deleted
          AND cb.IsDeleted = :is_deleted
          AND o.Data BETWEEN :start_date AND :end_date
        GROUP BY cb.Id, cb.Razao, cb.Email
        ORDER BY total_volume DESC
        OFFSET 0 ROWS FETCH NEXT :limit ROWS ONLY
    """)
    
    params = {
        'status': OperacaoStatus.FECHADO,
        'is_deleted': IsDeleted.ATIVO,
        'start_date': start_date,
        'end_date': end_date,
        'limit': limit
    }
    
    return self.db.execute_query(query, params)
```

**Frontend (Chart.js)**:
```javascript
function createClientRankingChart(data) {
    const ctx = document.getElementById('clientRankingChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.client_name),
            datasets: [{
                label: 'Volume (R$)',
                data: data.map(d => d.total_volume),
                backgroundColor: '#BB5927',
                borderColor: '#363432',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
                    }
                }
            }
        }
    });
}
```

#### 3.2 Implementar KPI 2.2: Taxa de Inadimplência por Cliente

**Backend**:
```python
def get_inadimplencia_por_cliente(self, min_documents=5):
    query = text("""
        SELECT 
            cb.Id as client_id,
            cb.Razao as client_name,
            COUNT(d.Id) as total_documents,
            COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) as overdue_documents,
            CAST(COUNT(CASE WHEN v.Atraso > 0 THEN 1 END) AS FLOAT) * 100.0 / 
                NULLIF(COUNT(d.Id), 0) as default_rate,
            SUM(CASE WHEN v.Atraso > 0 THEN d.Valor ELSE 0 END) as overdue_value
        FROM CadastroBase cb
        INNER JOIN Operacao o ON cb.Id = o.ClienteId
        INNER JOIN Documento d ON o.Id = d.OperacaoId
        LEFT JOIN ViewDocumentoAtrasoCalculo v ON d.Id = v.DocumentoId
        WHERE d.IsDeleted = :is_deleted
          AND o.IsDeleted = :is_deleted
          AND cb.IsDeleted = :is_deleted
        GROUP BY cb.Id, cb.Razao
        HAVING COUNT(d.Id) >= :min_documents
        ORDER BY default_rate DESC
        OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY
    """)
    
    params = {
        'is_deleted': IsDeleted.ATIVO,
        'min_documents': min_documents
    }
    
    return self.db.execute_query(query, params)
```

#### 3.3 Implementar KPI 2.4: Score de Risco

**Backend** (usar query da especificação):
```python
def get_score_risco_clientes(self):
    # Ver query completa em DASHBOARD_SPECIFICATION_FINAL.md
    # KPI 2.4: Score de Risco por Cliente
    pass
```

#### 3.4 Implementar KPI 2.5: Análise de Churn

**Backend** (usar query da especificação):
```python
def get_analise_churn(self):
    # Ver query completa em DASHBOARD_SPECIFICATION_FINAL.md
    # KPI 2.5: Análise de Churn
    pass
```

**Funcionalidade Extra**: Exportar e-mails para campanha
```python
@kpi_bp.route('/clientes/churn/export-emails', methods=['GET'])
def export_churn_emails():
    clientes = kpi_service.get_analise_churn()
    
    emails = [c['client_email'] for c in clientes if c['client_email']]
    
    return jsonify({
        'success': True,
        'emails': emails,
        'count': len(emails)
    })
```

---

### Fase 4: Tela 3 - Desempenho de Agentes (3-4 dias)

**Prioridade**: 🟡 Alta

#### 4.1 Implementar KPI 3.1: Ranking de Agentes

**Backend**:
```python
def get_ranking_agentes(self, start_date, end_date):
    query = text("""
        SELECT 
            a.Id as agent_id,
            SUBSTRING(cb.Razao, 1, CHARINDEX(' ', cb.Razao + ' ') - 1) as agent_first_name,
            cb.Razao as agent_full_name,
            cb.Email as agent_email,
            COUNT(DISTINCT o.Id) as operation_count,
            SUM(o.ValorCompra) as total_volume,
            AVG(o.ValorCompra) as average_ticket,
            COUNT(DISTINCT o.ClienteId) as unique_clients,
            MAX(o.Data) as last_operation_date
        FROM Agente a
        INNER JOIN CadastroBase cb ON a.CadastroBaseId = cb.Id
        INNER JOIN Operacao o ON a.Id = o.AgenteId
        WHERE o.Status = :status
          AND o.IsDeleted = :is_deleted
          AND a.IsDeleted = :is_deleted
          AND cb.IsDeleted = :is_deleted
          AND o.Data BETWEEN :start_date AND :end_date
        GROUP BY a.Id, cb.Razao, cb.Email
        ORDER BY total_volume DESC
    """)
    
    params = {
        'status': OperacaoStatus.FECHADO,
        'is_deleted': IsDeleted.ATIVO,
        'start_date': start_date,
        'end_date': end_date
    }
    
    return self.db.execute_query(query, params)
```

#### 4.2 Implementar KPI 3.2: Carteira de Clientes por Agente

**Backend** (usar query da especificação):
```python
def get_carteira_agentes(self):
    # Ver query completa em DASHBOARD_SPECIFICATION_FINAL.md
    # KPI 3.2: Carteira de Clientes por Agente
    pass
```

#### 4.3 Implementar KPI 3.3: Operações Abertas por Agente

**Backend** (usar query da especificação):
```python
def get_operacoes_abertas_agentes(self, start_date, end_date):
    # Ver query completa em DASHBOARD_SPECIFICATION_FINAL.md
    # KPI 3.3: Operações Abertas por Agente
    pass
```

---

### Fase 5: Tela 4 - Análise de Risco (4-5 dias)

**Prioridade**: 🟡 Alta

#### 5.1 Implementar KPI 4.1: Aging de Documentos

**Backend** (usar query da especificação):
```python
def get_aging_documentos(self):
    # Ver query completa em DASHBOARD_SPECIFICATION_FINAL.md
    # KPI 4.1: Documentos Vencidos por Faixa de Atraso
    pass
```

#### 5.2 Implementar KPI 4.2: Taxa de Perda

**Backend** (usar query da especificação):
```python
def get_taxa_perda(self, start_date, end_date):
    # Ver query completa em DASHBOARD_SPECIFICATION_FINAL.md
    # KPI 4.2: Taxa de Perda
    pass
```

#### 5.3 Implementar KPI 4.3: Distribuição de Tipos de Baixa

**Backend** (usar query da especificação):
```python
def get_distribuicao_tipos_baixa(self, start_date, end_date):
    # Ver query completa em DASHBOARD_SPECIFICATION_FINAL.md
    # KPI 4.3: Distribuição de Tipos de Baixa
    pass
```

---

## 🔧 Funcionalidades Transversais

### WebSocket para Real-time

```python
# app/websocket/dashboard_ws.py
from flask_socketio import SocketIO, emit
from flask import request

socketio = SocketIO()

@socketio.on('connect', namespace='/dashboard')
def handle_connect():
    print(f'Cliente conectado: {request.sid}')
    emit('connected', {'message': 'Conectado ao dashboard'})

@socketio.on('disconnect', namespace='/dashboard')
def handle_disconnect():
    print(f'Cliente desconectado: {request.sid}')

def broadcast_kpi_update(kpi_type, data):
    """Broadcast de atualização de KPI para todos os clientes"""
    socketio.emit('kpi_update', {
        'type': kpi_type,
        'data': data,
        'timestamp': datetime.now().isoformat()
    }, namespace='/dashboard')
```

**Frontend**:
```javascript
// static/js/websocket.js
const socket = io('/dashboard');

socket.on('connect', () => {
    console.log('Conectado ao WebSocket');
});

socket.on('kpi_update', (data) => {
    console.log('Atualização de KPI:', data);
    handleKPIUpdate(data);
});

function handleKPIUpdate(update) {
    if (update.type === 'volume_operacoes') {
        updateVolumeCard(update.data);
    } else if (update.type === 'taxa_inadimplencia') {
        updateInadimplenciaCard(update.data);
    }
    // ... outros KPIs
}
```

---

### Filtros de Período

```html
<!-- templates/components/date_filter.html -->
<div class="row mb-3">
    <div class="col-md-3">
        <label for="start_date">Data Início</label>
        <input type="date" class="form-control" id="start_date">
    </div>
    <div class="col-md-3">
        <label for="end_date">Data Fim</label>
        <input type="date" class="form-control" id="end_date">
    </div>
    <div class="col-md-3">
        <label>&nbsp;</label>
        <button class="btn btn-primary form-control" onclick="applyDateFilter()">
            Aplicar Filtro
        </button>
    </div>
    <div class="col-md-3">
        <label>&nbsp;</label>
        <div class="btn-group form-control" role="group">
            <button type="button" class="btn btn-outline-secondary" onclick="setQuickFilter('today')">Hoje</button>
            <button type="button" class="btn btn-outline-secondary" onclick="setQuickFilter('week')">Semana</button>
            <button type="button" class="btn btn-outline-secondary" onclick="setQuickFilter('month')">Mês</button>
            <button type="button" class="btn btn-outline-secondary" onclick="setQuickFilter('year')">Ano</button>
        </div>
    </div>
</div>
```

---

### Exportação de Dados

```python
# app/routes/export_routes.py
from flask import Blueprint, send_file
import pandas as pd
from io import BytesIO

export_bp = Blueprint('export', __name__, url_prefix='/api/export')

@export_bp.route('/clientes/ranking', methods=['GET'])
def export_ranking_clientes():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    data = kpi_service.get_ranking_clientes(start_date, end_date, limit=1000)
    
    # Converter para DataFrame
    df = pd.DataFrame(data)
    
    # Criar arquivo Excel
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Ranking Clientes', index=False)
    
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'ranking_clientes_{start_date}_{end_date}.xlsx'
    )
```

---

## ✅ Checklist de Implementação

### Setup Inicial
- [ ] Configurar ambiente virtual Python
- [ ] Instalar dependências (Flask, SQLAlchemy, Chart.js, etc.)
- [ ] Configurar conexão com SQL Server
- [ ] Testar conexão com banco de dados
- [ ] Criar estrutura de pastas do projeto

### Tela 1: Visão Executiva
- [ ] KPI 1.1: Volume de Operações (Backend + Frontend)
- [ ] KPI 1.2: Taxa de Inadimplência (Backend + Frontend)
- [ ] KPI 1.3: ROI (Backend + Frontend)
- [ ] KPI 1.4: Ticket Médio (Backend + Frontend)
- [ ] Filtros de período
- [ ] Gráficos Chart.js
- [ ] Testes unitários

### Tela 2: Análise de Clientes
- [ ] KPI 2.1: Ranking de Clientes
- [ ] KPI 2.2: Taxa de Inadimplência por Cliente
- [ ] KPI 2.3: Distribuição por Faixa de Volume
- [ ] KPI 2.4: Score de Risco
- [ ] KPI 2.5: Análise de Churn
- [ ] Exportação de e-mails
- [ ] Testes unitários

### Tela 3: Desempenho de Agentes
- [ ] KPI 3.1: Ranking de Agentes
- [ ] KPI 3.2: Carteira de Clientes
- [ ] KPI 3.3: Operações Abertas
- [ ] KPI 3.4: Taxa de Conversão
- [ ] KPI 3.5: Evolução Temporal
- [ ] Testes unitários

### Tela 4: Análise de Risco
- [ ] KPI 4.1: Aging de Documentos
- [ ] KPI 4.2: Taxa de Perda
- [ ] KPI 4.3: Distribuição de Tipos de Baixa
- [ ] KPI 4.4: Concentração por Sacado
- [ ] KPI 4.5: Provisão para Perdas
- [ ] Testes unitários

### Funcionalidades Transversais
- [ ] WebSocket para real-time
- [ ] Filtros de período
- [ ] Exportação de dados (Excel/CSV)
- [ ] Autenticação e autorização
- [ ] Logs e monitoramento
- [ ] Deploy em produção

---

## 📚 Referências

- **Especificação Completa**: `docs/DASHBOARD_SPECIFICATION_FINAL.md`
- **Enums Confirmados**: `docs/ENUMS_CONFIRMADOS.md`
- **Constantes Python**: `app/constants/enums.py`
- **KPIs Detalhados**: `docs/KPI_CALCULATION_SPECIFICATION_V2.md`

---

## 🎯 Próximos Passos

1. **Revisar especificação completa** em `DASHBOARD_SPECIFICATION_FINAL.md`
2. **Configurar ambiente** de desenvolvimento
3. **Começar pela Tela 1** (Visão Executiva) - MVP
4. **Testar cada KPI** com dados reais do SSMS
5. **Iterar e evoluir** conforme feedback

---

**Boa implementação! 🚀**

**Última atualização**: 1 de novembro de 2025  
**Autor**: Dashboard Fonte Team  
**Versão**: 1.0

