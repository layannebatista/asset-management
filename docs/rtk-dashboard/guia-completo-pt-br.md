# RTK Dashboard - guia completo

O RTK Dashboard mostra, em linguagem de negócio, como o uso de RTK impacta consumo de tokens, eficiência de modelos e ROI.

## Acesso

```text
http://localhost:3100
```

## Seções principais

| Seção | O que responde |
|---|---|
| Resumo executivo | A economia geral está boa? |
| Economia de tokens | Quantos tokens foram evitados? |
| Eficiência por modelo | Qual modelo performa melhor no contexto? |
| ROI por análise | Quais análises trazem melhor retorno? |
| Histórico | A tendência melhorou ou piorou? |

## Como interpretar

- Tokens economizados: volume estimado que deixou de ser enviado/processado.
- Redução percentual: comparação entre fluxo com e sem otimização.
- Qualidade: indicador de utilidade do resultado.
- ROI: relação entre custo evitado e esforço/custo da análise.

## Dados reais e fallback

Quando há coleta real, o dashboard usa registros do banco. Quando não há dados suficientes, pode exibir dados de exemplo ou valores zerados, dependendo da configuração.

Antes de apresentar números, confirme:

- período analisado;
- existência de dados reais;
- volume de amostras;
- fonte usada.

## APIs de apoio

Endpoints locais comuns:

```text
/health
/api/v1/insights/token-economy
/api/v1/insights/model-efficiency
/api/v1/insights/analysis-roi
/api/v1/insights/executive-summary
/api/v1/insights/history
```

## Troubleshooting

| Sintoma | Verifique |
|---|---|
| Dashboard não abre | container e porta 3100 |
| Métricas zeradas | coleta de dados e período |
| API falha | logs do serviço |
| Valores estranhos | se são dados reais ou exemplo |

