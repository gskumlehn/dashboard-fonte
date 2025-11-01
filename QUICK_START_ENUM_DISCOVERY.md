# 🚀 Guia Rápido: Descoberta de Enums

**Objetivo**: Descobrir automaticamente os significados dos campos enum (Status, Tipo, etc.) do banco de dados LiveWork.

---

## ⚡ Execução Rápida (2 Comandos)

```bash
# 1. Analisar views e identificar padrões
cd /home/ubuntu/dashboard-fonte
python3 scripts/analyze_view_columns.py

# 2. Extrair mapeamentos de enum
python3 scripts/extract_enum_meanings.py
```

**Tempo total**: 5-10 minutos

---

## 📂 Arquivos Gerados

### Principais (para revisar):

1. **`data/enum_meanings/ENUMS_DESCOBERTOS.md`**  
   📄 Documento formatado com todos os enums descobertos  
   👉 **ESTE É O ARQUIVO PRINCIPAL PARA REVISAR**

2. **`data/enum_meanings/enum_constants.py`**  
   🐍 Classes Python com constantes para usar no código

### Auxiliares (para referência):

3. **`data/view_analysis/ENUM_PATTERNS_REPORT.md`**  
   📊 Relatório de padrões identificados

4. **`data/enum_meanings/enum_mappings.json`**  
   📋 Dados estruturados em JSON

---

## 🎯 Próximos Passos

1. ✅ **Revisar** `data/enum_meanings/ENUMS_DESCOBERTOS.md`
2. ✅ **Validar** com FinanBlue na reunião
3. ✅ **Atualizar** queries do dashboard
4. ✅ **Testar** com dados reais

---

## 📚 Documentação Completa

Para mais detalhes, consulte: **`scripts/README_ENUM_DISCOVERY.md`**

---

## ⚠️ Importante

- ✅ **Funciona com permissões básicas** (apenas SELECT)
- ✅ **Não requer VIEW DEFINITION**
- ✅ **Automatizado** (sem intervenção manual)
- ⚠️ **Complementar com reunião** da FinanBlue para preencher lacunas

---

**Última atualização**: 31 de outubro de 2025

