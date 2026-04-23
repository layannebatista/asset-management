# IA Intelligence - Rule Engine (Guia Consolidado)

## Objetivo
Concentrar configuracao, uso, extensao e operacao do Rule Engine do dashboard da IA.

## Componentes Principais
- Configuracao centralizada de pesos, limiares e penalidades.
- Funcoes deterministicas para calculo de qualidade, risco, estabilidade e taxa de acao.
- Orquestrador que agrega as regras e entrega saida unica para visualizacao.

## Metricas Tipicas
- Qualidade ajustada
- Risco (score e nivel)
- Estabilidade
- Volume de problemas
- Taxa de acao

## Presets
Padroes de configuracao comuns:
- Default
- Strict
- Relaxed
- Performance
- Reliability
- Quality Gate
- Incident

## Extensibilidade
Para adicionar novas regras:
1. Defina claramente entrada e saida da regra.
2. Garanta funcao pura (sem estado global).
3. Inclua no orquestrador com peso e limiar documentados.
4. Valide com exemplos de dados reais.

## Boas Praticas
- Evitar dependencia externa desnecessaria dentro das regras.
- Garantir repetibilidade (mesma entrada, mesma saida).
- Manter coerencia entre visualizacao no dashboard e exportacoes.
