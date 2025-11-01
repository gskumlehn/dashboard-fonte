# Descoberta Automática de Significados de Enums

**Data**: 31 de outubro de 2025  
**Autor**: Dashboard Fonte Team  
**Versão**: 1.0

---

## 📋 Visão Geral

Este documento descreve o processo automatizado de descoberta dos significados dos campos enum (Status, Tipo, etc.) do banco de dados LiveWork através da análise de views que contêm pares de colunas enum+descrição.

O processo consiste em **dois scripts principais** que devem ser executados em sequência:

1. **`analyze_view_columns.py`** - Analisa views e identifica padrões de enum+descrição
2. **`extract_enum_meanings.py`** - Executa queries e extrai os mapeamentos reais

---

## 🎯 Problema Resolvido

O banco de dados LiveWork armazena valores de enum como números (0, 1, 2, etc.) sem tabelas de lookup correspondentes. Isso torna impossível saber o significado de valores como:

- `Operacao.Status = 1` → Significa "Ativo"? "Pendente"? "Aprovado"?
- `Documento.Tipo = 3` → Significa "Duplicata"? "Cheque"? "Nota Fiscal"?

**Solução**: Muitas views do sistema já contêm pares de colunas que mapeiam valores enum para suas descrições (ex: `Status` + `StatusDescricao`). Nossos scripts identificam esses padrões automaticamente e extraem os mapeamentos.

---

## 🔧 Pré-requisitos

### 1. Configuração do Ambiente

Certifique-se de que o arquivo `.env` está configurado corretamente:

```bash
DB_SERVER=seu_servidor.database.windows.net
DB_DATABASE=livework_fonte
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DRIVER=ODBC Driver 18 for SQL Server
```

### 2. Dependências Python

Os scripts utilizam as seguintes bibliotecas:

```bash
pip install pyodbc python-dotenv tqdm
```

### 3. Permissões de Banco de Dados

**Permissões necessárias**:
- ✅ `SELECT` em views (permissão mínima)
- ❌ `VIEW DEFINITION` **NÃO é necessário**

**Importante**: Diferente de outros scripts que tentam ler o código SQL das views, estes scripts apenas **executam queries SELECT** nas views, o que funciona com permissões básicas de leitura.

---

## 🚀 Passo a Passo

### Passo 1: Analisar Views

Execute o script `analyze_view_columns.py` para identificar padrões de enum+descrição:

```bash
cd /home/ubuntu/dashboard-fonte
python3 scripts/analyze_view_columns.py
```

**O que este script faz**:

1. Lista todas as views do banco de dados
2. Analisa as colunas de cada view
3. Identifica padrões como:
   - `Status` + `StatusDescricao`
   - `Tipo` + `TipoDescricao`
   - `Status` + `Descricao`
4. Gera 3 arquivos de saída:
   - `data/view_analysis/view_analysis_metadata.json` - Metadados completos
   - `data/view_analysis/extract_enum_mappings.sql` - Queries SQL geradas
   - `data/view_analysis/ENUM_PATTERNS_REPORT.md` - Relatório formatado

**Tempo estimado**: 2-5 minutos (dependendo do número de views)

**Saída esperada**:

```
🔍 ANALISADOR DE VIEWS - IDENTIFICAÇÃO DE PADRÕES DE ENUM
================================================================================
📁 Diretório de saída: /home/ubuntu/dashboard-fonte/data/view_analysis
✅ Encontradas 150 views no banco de dados

📊 Analisando 150 views...
Analisando views: 100%|████████████████████| 150/150 [00:45<00:00,  3.33view/s]

================================================================================
📊 RESUMO DA ANÁLISE
================================================================================
✅ Views analisadas: 150
✅ Views com padrões de enum: 45
✅ Total de pares enum+descrição: 120
================================================================================

📄 Metadados salvos em: data/view_analysis/view_analysis_metadata.json
📄 Queries SQL salvas em: data/view_analysis/extract_enum_mappings.sql
📄 Relatório Markdown salvo em: data/view_analysis/ENUM_PATTERNS_REPORT.md

✅ Análise concluída!
```

---

### Passo 2: Extrair Mapeamentos

Execute o script `extract_enum_meanings.py` para extrair os valores reais:

```bash
cd /home/ubuntu/dashboard-fonte
python3 scripts/extract_enum_meanings.py
```

**O que este script faz**:

1. Lê o arquivo `view_analysis_metadata.json`
2. Executa queries SQL para cada padrão identificado
3. Extrai mapeamentos (valor → descrição) com contagem de ocorrências
4. Gera 3 arquivos de saída:
   - `data/enum_meanings/enum_mappings.json` - Dados estruturados
   - `data/enum_meanings/ENUMS_DESCOBERTOS.md` - Documento formatado
   - `data/enum_meanings/enum_constants.py` - Classes Python com constantes

**Tempo estimado**: 3-8 minutos (dependendo do número de padrões)

**Saída esperada**:

```
🔍 EXTRATOR DE SIGNIFICADOS DE ENUMS
================================================================================
✅ Metadados carregados: data/view_analysis/view_analysis_metadata.json
   - Views analisadas: 150
   - Views com padrões: 45
   - Pares enum+descrição: 120
📁 Diretório de saída: /home/ubuntu/dashboard-fonte/data/enum_meanings

📊 Processando 45 views com padrões de enum...

Extraindo enums: 100%|████████████████████| 120/120 [01:30<00:00,  1.33enum/s]

================================================================================
📊 RESUMO DA EXTRAÇÃO
================================================================================
✅ Enums extraídos com sucesso: 115
❌ Erros: 5
================================================================================

📄 Mapeamentos JSON salvos em: data/enum_meanings/enum_mappings.json
📄 Documento Markdown salvo em: data/enum_meanings/ENUMS_DESCOBERTOS.md
📄 Constantes Python salvas em: data/enum_meanings/enum_constants.py

✅ Extração concluída!
```

---

## 📊 Arquivos Gerados

### 1. Análise de Views (`data/view_analysis/`)

#### `view_analysis_metadata.json`

Metadados completos da análise em formato JSON:

```json
{
  "analysis_date": "2025-10-31T22:30:00",
  "total_views_analyzed": 150,
  "views_with_patterns": 45,
  "total_enum_candidates": 120,
  "views": [
    {
      "schema": "dbo",
      "view": "vw_Operacoes",
      "total_columns": 25,
      "enum_patterns": [
        {
          "enum_field": "Status",
          "enum_type": "tinyint",
          "desc_field": "StatusDescricao",
          "desc_type": "varchar",
          "pattern": "Status+Descricao"
        }
      ]
    }
  ]
}
```

#### `extract_enum_mappings.sql`

Queries SQL prontas para executar manualmente (se necessário):

```sql
-- View: dbo.vw_Operacoes
-- Status (tinyint) -> StatusDescricao (varchar)
SELECT DISTINCT
    Status AS Valor,
    StatusDescricao AS Descricao,
    COUNT(*) AS Quantidade
FROM dbo.vw_Operacoes
WHERE Status IS NOT NULL
  AND StatusDescricao IS NOT NULL
GROUP BY Status, StatusDescricao
ORDER BY Status;
```

#### `ENUM_PATTERNS_REPORT.md`

Relatório formatado com estatísticas e lista de padrões encontrados.

---

### 2. Mapeamentos de Enums (`data/enum_meanings/`)

#### `enum_mappings.json`

Mapeamentos completos em formato JSON:

```json
{
  "extraction_date": "2025-10-31T22:35:00",
  "total_enums": 115,
  "total_errors": 5,
  "mappings": {
    "dbo.vw_Operacoes.Status": {
      "schema": "dbo",
      "view": "vw_Operacoes",
      "enum_field": "Status",
      "enum_type": "tinyint",
      "desc_field": "StatusDescricao",
      "desc_type": "varchar",
      "pattern": "Status+Descricao",
      "values": [
        {
          "valor": 0,
          "descricao": "Pendente",
          "quantidade": 1250
        },
        {
          "valor": 1,
          "descricao": "Aprovado",
          "quantidade": 8450
        }
      ]
    }
  }
}
```

#### `ENUMS_DESCOBERTOS.md`

**Documento principal** com todos os enums descobertos, formatado e organizado para fácil leitura e referência.

Estrutura do documento:

- **Resumo**: Estatísticas gerais
- **Índice**: Links para cada enum
- **Detalhamento**: Tabelas com valores, descrições e quantidades
- **Exemplos SQL**: Como usar cada enum em queries
- **Próximos passos**: Validação e implementação

#### `enum_constants.py`

Classes Python com constantes para usar no código:

```python
class Status:
    """Status - Valores possíveis"""
    # Fonte: dbo.vw_Operacoes
    # Tipo: tinyint

    PENDENTE = 0  # Pendente
    APROVADO = 1  # Aprovado
    REJEITADO = 2  # Rejeitado
    CANCELADO = 3  # Cancelado

    _DESCRIPTIONS = {
        0: "Pendente",
        1: "Aprovado",
        2: "Rejeitado",
        3: "Cancelado",
    }

    @classmethod
    def get_description(cls, value):
        """Retorna a descrição do valor do enum"""
        return cls._DESCRIPTIONS.get(value, "Desconhecido")
```

**Uso no código**:

```python
from data.enum_meanings.enum_constants import Status

# Usar constantes em queries
query = f"SELECT * FROM Operacao WHERE Status = {Status.APROVADO}"

# Obter descrição
print(Status.get_description(1))  # Output: "Aprovado"
```

---

## 🎯 Padrões Identificados

Os scripts identificam automaticamente os seguintes padrões:

### Padrão 1: Sufixo Direto

Campo enum + sufixo de descrição sem separador:

- `Status` + `StatusDescricao`
- `Tipo` + `TipoDesc`
- `Status` + `StatusNome`

### Padrão 2: Sufixo com Underscore

Campo enum + underscore + sufixo de descrição:

- `Status` + `Status_Descricao`
- `Tipo` + `Tipo_Nome`

### Padrão 3: Descrição Genérica

Campo enum + campo de descrição genérico:

- `Status` + `Descricao`
- `Tipo` + `Nome`

**Nota**: Este padrão só é considerado em views com poucas colunas para evitar falsos positivos.

---

## 🔍 Tipos de Dados Considerados

### Campos Enum (Numéricos)

- `tinyint` ✅
- `smallint` ✅
- `int` ✅
- `bigint` ✅
- `bit` ✅

### Campos Descrição (Texto)

- `varchar` ✅
- `nvarchar` ✅
- `char` ✅
- `nchar` ✅
- `text` ✅
- `ntext` ✅

---

## ⚠️ Limitações e Considerações

### 1. Dependência de Views

Os scripts só conseguem descobrir enums que estão presentes em views com padrões de enum+descrição. Se um campo enum não aparecer em nenhuma view com sua descrição, ele não será descoberto.

**Solução**: Complementar com a reunião da FinanBlue para preencher lacunas.

### 2. Múltiplas Fontes

Um mesmo campo enum pode aparecer em múltiplas views com descrições diferentes. Os scripts registram todas as ocorrências.

**Solução**: Revisar o documento `ENUMS_DESCOBERTOS.md` e validar qual fonte é a mais confiável.

### 3. Valores Não Utilizados

Se um valor de enum nunca foi usado no sistema, ele não aparecerá nos resultados (pois não há dados nas views).

**Solução**: Validar com a FinanBlue se existem valores possíveis que não estão em uso.

### 4. Campos Calculados

Alguns campos em views podem ser calculados ou transformados, não refletindo exatamente os valores da tabela base.

**Solução**: Testar queries com dados reais antes de usar em produção.

---

## 🚀 Próximos Passos

### 1. Revisar Documento

Abra e revise o arquivo `data/enum_meanings/ENUMS_DESCOBERTOS.md`:

```bash
cd /home/ubuntu/dashboard-fonte
cat data/enum_meanings/ENUMS_DESCOBERTOS.md
```

### 2. Validar com FinanBlue

Use o documento na reunião com a FinanBlue para:

- ✅ Confirmar valores descobertos
- ✅ Preencher lacunas de enums não encontrados
- ✅ Validar regras de negócio

### 3. Atualizar Queries do Dashboard

Atualize as queries dos KPIs usando os valores descobertos:

**Antes**:
```sql
-- ❌ Não sabemos o que é Status = 1
SELECT COUNT(*) FROM Operacao WHERE Status = 1
```

**Depois**:
```sql
-- ✅ Usando constante descoberta
SELECT COUNT(*) FROM Operacao WHERE Status = 1  -- Aprovado
```

Ou melhor ainda, usando as constantes Python:

```python
from data.enum_meanings.enum_constants import Status

query = f"""
    SELECT COUNT(*) 
    FROM Operacao 
    WHERE Status = {Status.APROVADO}
"""
```

### 4. Testar com Dados Reais

Execute as queries atualizadas no SSMS para validar os resultados:

```sql
-- Teste: Volume de operações aprovadas
SELECT 
    COUNT(*) as Total,
    SUM(ValorOperacao) as Valor_Total
FROM Operacao
WHERE Status = 1  -- Aprovado (descoberto)
  AND IsDeleted = 0;
```

### 5. Documentar Descobertas

Crie um arquivo `docs/ENUMS_CONFIRMADOS.md` com os valores validados pela FinanBlue.

---

## 🛠️ Troubleshooting

### Erro: "Arquivo de metadados não encontrado"

**Problema**: Você executou `extract_enum_meanings.py` antes de `analyze_view_columns.py`.

**Solução**:
```bash
# Execute primeiro a análise
python3 scripts/analyze_view_columns.py

# Depois a extração
python3 scripts/extract_enum_meanings.py
```

---

### Erro: "Login failed for user"

**Problema**: Credenciais do banco de dados incorretas ou expiradas.

**Solução**:
```bash
# Verifique o arquivo .env
cat .env

# Teste a conexão
python3 -c "from app.infra.db_connection import Database; db = Database(); print('Conexão OK')"
```

---

### Erro: "The SELECT permission was denied"

**Problema**: Usuário não tem permissão para ler determinada view.

**Solução**: Este erro é esperado para algumas views do sistema. Os scripts continuam processando as demais views. Se muitas views falharem, solicite permissões adicionais ao DBA.

---

### Nenhum Padrão Encontrado

**Problema**: O script não encontrou nenhum padrão de enum+descrição.

**Possíveis causas**:
1. Views não seguem os padrões esperados
2. Banco de dados não tem views, apenas tabelas
3. Permissões insuficientes

**Solução**:
```bash
# Verifique se há views no banco
python3 -c "
from app.infra.db_connection import Database
db = Database()
views = db.execute_query(\"SELECT COUNT(*) FROM INFORMATION_SCHEMA.VIEWS\")
print(f'Total de views: {views[0][0]}')
"
```

---

## 📚 Referências

- **Especificação de KPIs**: `docs/KPI_Calculation_Specification.md`
- **Especificação do Dashboard**: `docs/DASHBOARD_SPECIFICATION_V2.md`
- **Perguntas para FinanBlue**: `docs/PERGUNTAS_REUNIAO_FINANBLUE.md`
- **Análise de Enums**: `docs/analysis/Enum_Fields_Analysis.md`

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Revise este documento
2. Consulte os logs de execução dos scripts
3. Verifique os arquivos de saída gerados
4. Entre em contato com a equipe de desenvolvimento

---

**Última atualização**: 31 de outubro de 2025  
**Versão**: 1.0  
**Autor**: Dashboard Fonte Team

