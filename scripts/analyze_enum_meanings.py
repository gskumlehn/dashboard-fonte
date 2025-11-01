#!/usr/bin/env python3
"""
Script para analisar mapeamentos de enums e gerar documento agrupado

Este script:
1. Lê o arquivo JSON com mapeamentos de enums
2. Agrupa por campo enum (removendo schema.view)
3. Analisa padrões e significados
4. Gera documento Markdown formatado

Autor: Dashboard Fonte Team
Data: 1 de novembro de 2025
Versão: 1.0
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict


class EnumMeaningAnalyzer:
    """Analisador de significados de enums"""
    
    def __init__(self, json_file):
        """
        Inicializa o analisador
        
        Args:
            json_file (str): Caminho para o arquivo JSON com mapeamentos
        """
        self.json_file = Path(json_file)
        self.data = None
        self.enum_groups = defaultdict(list)
        self.analysis = {}
        
    def load_json(self):
        """Carrega o arquivo JSON"""
        print(f"📂 Carregando: {self.json_file}")
        
        with open(self.json_file, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
        
        print(f"✅ Total de enums: {self.data['total_enums']}")
        print(f"✅ Data da extração: {self.data['extraction_date']}")
        
    def group_by_enum_field(self):
        """Agrupa mapeamentos por campo enum"""
        print("\n📊 Agrupando por campo enum...")
        
        for key, mapping in self.data['mappings'].items():
            enum_field = mapping['enum_field']
            self.enum_groups[enum_field].append(mapping)
        
        print(f"✅ {len(self.enum_groups)} campos enum únicos identificados")
        
    def analyze_enum(self, enum_field, mappings):
        """
        Analisa um campo enum específico
        
        Args:
            enum_field (str): Nome do campo enum
            mappings (list): Lista de mapeamentos para este campo
            
        Returns:
            dict: Análise do enum
        """
        # Usa o primeiro mapeamento como principal
        main_mapping = mappings[0]
        
        # Coleta todos os valores únicos
        all_values = {}
        for mapping in mappings:
            for value in mapping['values']:
                valor = value['valor']
                descricao = value['descricao'].strip()
                quantidade = value['quantidade']
                
                if valor not in all_values:
                    all_values[valor] = {
                        'descricoes': {},
                        'total_quantidade': 0
                    }
                
                if descricao not in all_values[valor]['descricoes']:
                    all_values[valor]['descricoes'][descricao] = 0
                
                all_values[valor]['descricoes'][descricao] += quantidade
                all_values[valor]['total_quantidade'] += quantidade
        
        # Determina a descrição principal para cada valor
        valores_consolidados = []
        for valor in sorted(all_values.keys()):
            data = all_values[valor]
            
            # Descrição mais comum
            descricao_principal = max(
                data['descricoes'].items(),
                key=lambda x: x[1]
            )[0] if data['descricoes'] else ''
            
            # Outras descrições (se houver)
            outras_descricoes = [
                desc for desc in data['descricoes'].keys()
                if desc != descricao_principal and desc != ''
            ]
            
            valores_consolidados.append({
                'valor': valor,
                'descricao_principal': descricao_principal,
                'outras_descricoes': outras_descricoes,
                'quantidade_total': data['total_quantidade'],
                'variantes': len(data['descricoes'])
            })
        
        # Análise de padrões
        patterns = self._identify_patterns(valores_consolidados)
        
        return {
            'enum_field': enum_field,
            'enum_type': main_mapping['enum_type'],
            'sources': [
                {
                    'schema': m['schema'],
                    'view': m['view'],
                    'desc_field': m['desc_field']
                }
                for m in mappings
            ],
            'valores': valores_consolidados,
            'patterns': patterns,
            'total_valores': len(valores_consolidados),
            'total_registros': sum(v['quantidade_total'] for v in valores_consolidados)
        }
    
    def _identify_patterns(self, valores):
        """
        Identifica padrões nos valores do enum
        
        Args:
            valores (list): Lista de valores consolidados
            
        Returns:
            dict: Padrões identificados
        """
        patterns = {
            'is_boolean': False,
            'is_sequential': False,
            'has_gaps': False,
            'is_status_workflow': False,
            'is_categorical': False
        }
        
        if not valores:
            return patterns
        
        valores_numericos = [v['valor'] for v in valores]
        
        # Boolean (0, 1)
        if set(valores_numericos) == {0, 1}:
            patterns['is_boolean'] = True
        
        # Sequencial (sem gaps)
        if valores_numericos == list(range(min(valores_numericos), max(valores_numericos) + 1)):
            patterns['is_sequential'] = True
        
        # Tem gaps
        if max(valores_numericos) - min(valores_numericos) + 1 > len(valores_numericos):
            patterns['has_gaps'] = True
        
        # Status workflow (palavras-chave)
        status_keywords = ['aberto', 'pendente', 'aprovado', 'rejeitado', 'cancelado', 
                          'baixado', 'liquidado', 'pago', 'vencido', 'estornado']
        descricoes = ' '.join([v['descricao_principal'].lower() for v in valores])
        if any(keyword in descricoes for keyword in status_keywords):
            patterns['is_status_workflow'] = True
        
        # Categórico (tipos, modalidades)
        if len(valores) >= 3 and not patterns['is_boolean']:
            patterns['is_categorical'] = True
        
        return patterns
    
    def analyze_all_enums(self):
        """Analisa todos os enums agrupados"""
        print("\n🔍 Analisando significados dos enums...")
        
        for enum_field, mappings in self.enum_groups.items():
            self.analysis[enum_field] = self.analyze_enum(enum_field, mappings)
        
        print(f"✅ {len(self.analysis)} enums analisados")
    
    def generate_markdown(self, output_file):
        """
        Gera documento Markdown com análise
        
        Args:
            output_file (str): Caminho para o arquivo de saída
        """
        output_path = Path(output_file)
        
        print(f"\n📝 Gerando documento: {output_path}")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            self._write_header(f)
            self._write_summary(f)
            self._write_index(f)
            self._write_enum_details(f)
            self._write_critical_enums(f)
            self._write_footer(f)
        
        print(f"✅ Documento gerado com sucesso!")
    
    def _write_header(self, f):
        """Escreve cabeçalho do documento"""
        f.write("# Análise de Significados dos Enums - LiveWork Database\n\n")
        f.write(f"**Data da Análise**: {datetime.now().strftime('%d de %B de %Y, %H:%M:%S')}\n\n")
        f.write(f"**Data da Extração**: {self.data['extraction_date']}\n\n")
        f.write(f"**Total de Enums Extraídos**: {self.data['total_enums']}\n\n")
        f.write(f"**Campos Enum Únicos**: {len(self.enum_groups)}\n\n")
        f.write("---\n\n")
    
    def _write_summary(self, f):
        """Escreve resumo executivo"""
        f.write("## 📊 Resumo Executivo\n\n")
        
        # Estatísticas gerais
        total_valores = sum(a['total_valores'] for a in self.analysis.values())
        total_registros = sum(a['total_registros'] for a in self.analysis.values())
        
        f.write(f"Este documento apresenta a análise detalhada de **{len(self.analysis)} campos enum** ")
        f.write(f"extraídos do banco de dados LiveWork, totalizando **{total_valores} valores únicos** ")
        f.write(f"e **{total_registros:,} registros** analisados.\n\n")
        
        # Tipos de enum identificados
        boolean_count = sum(1 for a in self.analysis.values() if a['patterns']['is_boolean'])
        status_count = sum(1 for a in self.analysis.values() if a['patterns']['is_status_workflow'])
        categorical_count = sum(1 for a in self.analysis.values() if a['patterns']['is_categorical'])
        
        f.write("### Classificação dos Enums\n\n")
        f.write("| Tipo | Quantidade | Descrição |\n")
        f.write("|------|------------|----------|\n")
        f.write(f"| **Boolean** | {boolean_count} | Campos binários (0/1, Sim/Não) |\n")
        f.write(f"| **Status/Workflow** | {status_count} | Campos de status e fluxo de trabalho |\n")
        f.write(f"| **Categórico** | {categorical_count} | Campos com múltiplas categorias |\n")
        f.write("\n---\n\n")
    
    def _write_index(self, f):
        """Escreve índice de enums"""
        f.write("## 🎯 Índice de Enums\n\n")
        
        # Agrupa por tipo
        boolean_enums = []
        status_enums = []
        categorical_enums = []
        
        for enum_field, analysis in sorted(self.analysis.items()):
            if analysis['patterns']['is_boolean']:
                boolean_enums.append(enum_field)
            elif analysis['patterns']['is_status_workflow']:
                status_enums.append(enum_field)
            else:
                categorical_enums.append(enum_field)
        
        if boolean_enums:
            f.write("### Enums Boolean\n\n")
            for enum_field in boolean_enums:
                f.write(f"- [{enum_field}](#{enum_field.lower().replace('_', '-')})\n")
            f.write("\n")
        
        if status_enums:
            f.write("### Enums de Status/Workflow\n\n")
            for enum_field in status_enums:
                f.write(f"- [{enum_field}](#{enum_field.lower().replace('_', '-')})\n")
            f.write("\n")
        
        if categorical_enums:
            f.write("### Enums Categóricos\n\n")
            for enum_field in categorical_enums:
                f.write(f"- [{enum_field}](#{enum_field.lower().replace('_', '-')})\n")
            f.write("\n")
        
        f.write("---\n\n")
    
    def _write_enum_details(self, f):
        """Escreve detalhamento de cada enum"""
        f.write("## 📋 Detalhamento dos Enums\n\n")
        
        for enum_field in sorted(self.analysis.keys()):
            analysis = self.analysis[enum_field]
            self._write_enum_section(f, analysis)
    
    def _write_enum_section(self, f, analysis):
        """Escreve seção de um enum específico"""
        enum_field = analysis['enum_field']
        
        f.write(f"### {enum_field}\n\n")
        
        # Informações básicas
        f.write(f"**Tipo**: `{analysis['enum_type']}`\n\n")
        f.write(f"**Total de valores**: {analysis['total_valores']}\n\n")
        f.write(f"**Total de registros**: {analysis['total_registros']:,}\n\n")
        
        # Fontes
        if len(analysis['sources']) > 1:
            f.write(f"**Encontrado em {len(analysis['sources'])} views**:\n\n")
            for source in analysis['sources']:
                f.write(f"- `{source['schema']}.{source['view']}` (campo: `{source['desc_field']}`)\n")
            f.write("\n")
        else:
            source = analysis['sources'][0]
            f.write(f"**Fonte**: `{source['schema']}.{source['view']}` (campo: `{source['desc_field']}`)\n\n")
        
        # Classificação
        patterns = analysis['patterns']
        classificacao = []
        if patterns['is_boolean']:
            classificacao.append("Boolean")
        if patterns['is_status_workflow']:
            classificacao.append("Status/Workflow")
        if patterns['is_categorical']:
            classificacao.append("Categórico")
        if patterns['is_sequential']:
            classificacao.append("Sequencial")
        if patterns['has_gaps']:
            classificacao.append("Com Gaps")
        
        if classificacao:
            f.write(f"**Classificação**: {', '.join(classificacao)}\n\n")
        
        # Tabela de valores
        f.write("#### Valores e Significados\n\n")
        f.write("| Valor | Descrição | Quantidade | % |\n")
        f.write("|-------|-----------|------------|---|\n")
        
        for v in analysis['valores']:
            valor = v['valor'] if v['valor'] is not None else 'NULL'
            descricao = v['descricao_principal'] if v['descricao_principal'] else '*(vazio)*'
            quantidade = f"{v['quantidade_total']:,}"
            percentual = (v['quantidade_total'] / analysis['total_registros'] * 100) if analysis['total_registros'] > 0 else 0
            
            f.write(f"| `{valor}` | {descricao} | {quantidade} | {percentual:.1f}% |\n")
            
            # Outras descrições (variantes)
            if v['outras_descricoes']:
                for outra in v['outras_descricoes'][:3]:  # Limita a 3
                    f.write(f"| | *→ {outra}* | | |\n")
        
        f.write("\n")
        
        # Interpretação
        f.write("#### 💡 Interpretação\n\n")
        self._write_interpretation(f, analysis)
        
        # Exemplo de uso
        f.write("#### 📝 Exemplo de Uso em SQL\n\n")
        f.write("```sql\n")
        
        if analysis['valores']:
            primeiro_valor = analysis['valores'][0]
            f.write(f"-- Filtrar por valor específico\n")
            f.write(f"WHERE {enum_field} = {primeiro_valor['valor']}  -- {primeiro_valor['descricao_principal']}\n\n")
            
            if len(analysis['valores']) > 1:
                f.write(f"-- Filtrar por múltiplos valores\n")
                valores_list = ', '.join(str(v['valor']) for v in analysis['valores'][:3])
                f.write(f"WHERE {enum_field} IN ({valores_list})\n")
        
        f.write("```\n\n")
        f.write("---\n\n")
    
    def _write_interpretation(self, f, analysis):
        """Escreve interpretação do enum"""
        patterns = analysis['patterns']
        
        if patterns['is_boolean']:
            f.write("Este é um **campo boolean** que representa uma condição binária (Sim/Não, Ativo/Inativo, etc.).\n\n")
        
        elif patterns['is_status_workflow']:
            f.write("Este é um **campo de status** que representa diferentes estados em um fluxo de trabalho. ")
            f.write("Os valores indicam a progressão de um processo de negócio.\n\n")
            
            # Tenta identificar o fluxo
            descricoes = [v['descricao_principal'].lower() for v in analysis['valores']]
            if 'aberto' in descricoes or 'pendente' in descricoes:
                f.write("**Fluxo identificado**: Estado inicial → Processamento → Estado final\n\n")
        
        elif patterns['is_categorical']:
            f.write("Este é um **campo categórico** que representa diferentes tipos ou categorias. ")
            f.write("Cada valor identifica uma classificação específica.\n\n")
        
        # Observações sobre gaps
        if patterns['has_gaps']:
            f.write("⚠️ **Observação**: Este enum possui valores não sequenciais (gaps), ")
            f.write("indicando que alguns valores podem ter sido descontinuados ou reservados para uso futuro.\n\n")
        
        # Observações sobre variantes
        variantes_count = sum(1 for v in analysis['valores'] if v['variantes'] > 1)
        if variantes_count > 0:
            f.write(f"⚠️ **Atenção**: {variantes_count} valor(es) possuem múltiplas descrições em diferentes views. ")
            f.write("Recomenda-se validar qual é a descrição correta com a equipe da FinanBlue.\n\n")
    
    def _write_critical_enums(self, f):
        """Escreve seção de enums críticos para o dashboard"""
        f.write("## 🎯 Enums Críticos para o Dashboard\n\n")
        
        critical_enums = {
            'Status': 'Status de operações e documentos',
            'DocumentoStatus': 'Status de documentos (crítico para Taxa de Inadimplência)',
            'TipoRecompra': 'Tipo de recompra (crítico para Taxa de Recompra)',
            'TipoBaixa': 'Tipo de baixa de documentos',
            'ControladoriaDocumentoStatus': 'Status na controladoria'
        }
        
        f.write("Os seguintes enums são **críticos** para o cálculo dos KPIs do dashboard:\n\n")
        
        for enum_name, descricao in critical_enums.items():
            # Busca enums que contenham o nome
            matching = [k for k in self.analysis.keys() if enum_name.lower() in k.lower()]
            
            if matching:
                f.write(f"### {enum_name}\n\n")
                f.write(f"**Importância**: {descricao}\n\n")
                
                for match in matching:
                    analysis = self.analysis[match]
                    f.write(f"**Campo**: `{match}`\n\n")
                    
                    # Valores principais
                    f.write("**Valores principais**:\n\n")
                    for v in analysis['valores'][:5]:  # Top 5
                        f.write(f"- `{v['valor']}` = {v['descricao_principal']} ")
                        f.write(f"({v['quantidade_total']:,} registros)\n")
                    
                    f.write("\n")
                
                f.write("---\n\n")
    
    def _write_footer(self, f):
        """Escreve rodapé do documento"""
        f.write("## 🚀 Próximos Passos\n\n")
        f.write("1. **Revisar** os enums críticos listados acima\n")
        f.write("2. **Validar** significados com a equipe da FinanBlue\n")
        f.write("3. **Atualizar** queries do dashboard com valores confirmados\n")
        f.write("4. **Testar** KPIs com dados reais\n")
        f.write("5. **Documentar** regras de negócio específicas\n\n")
        
        f.write("---\n\n")
        f.write("## 📚 Referências\n\n")
        f.write(f"- **Arquivo JSON original**: `{self.json_file.name}`\n")
        f.write("- **Especificação de KPIs**: `docs/KPI_Calculation_Specification.md`\n")
        f.write("- **Especificação do Dashboard**: `docs/DASHBOARD_SPECIFICATION_V2.md`\n")
        f.write("- **Perguntas para FinanBlue**: `docs/PERGUNTAS_REUNIAO_FINANBLUE.md`\n\n")
        
        f.write("---\n\n")
        f.write(f"**Documento gerado automaticamente em**: {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}\n\n")
        f.write("**Autor**: Dashboard Fonte Team\n")


def main():
    """Função principal"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Analisa mapeamentos de enums e gera documento agrupado'
    )
    parser.add_argument(
        'json_file',
        help='Arquivo JSON com mapeamentos de enums'
    )
    parser.add_argument(
        '--output',
        '-o',
        default='./data/enum_meanings/ENUMS_ANALISADOS.md',
        help='Arquivo de saída (Markdown)'
    )
    
    args = parser.parse_args()
    
    # Cria analisador
    analyzer = EnumMeaningAnalyzer(args.json_file)
    
    # Processa
    analyzer.load_json()
    analyzer.group_by_enum_field()
    analyzer.analyze_all_enums()
    analyzer.generate_markdown(args.output)
    
    print(f"\n✅ Análise concluída!")
    print(f"📄 Documento gerado: {args.output}")


if __name__ == '__main__':
    main()

