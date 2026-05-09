# Sprint Reporter

O Sprint Reporter transforma dados técnicos em um resumo de sprint mais fácil de apresentar. Ele junta informações de testes, CI/CD, performance e RTK.

## Para que serve

- Ver saúde geral da sprint.
- Entender taxa de sucesso dos testes.
- Acompanhar pipelines.
- Mostrar problemas e recomendações.
- Exportar uma apresentação em PowerPoint.

## Acesso

Com a stack completa rodando:

```text
http://localhost:3200
```

Healthcheck:

```text
http://localhost:3200/health
```

## Como gerar relatório

1. Abra o dashboard.
2. Informe data inicial e final.
3. Clique para gerar relatório.
4. Aguarde a coleta.
5. Revise os blocos do dashboard.
6. Baixe o PowerPoint, se necessário.

## O que aparece no relatório

| Seção | O que mostra |
|---|---|
| Resumo executivo | Situação geral e principais sinais |
| Testes | Sucesso, falhas, instabilidade e cobertura visual |
| CI/CD | Execuções, falhas e tempo médio |
| IA/RTK | Uso, economia de tokens e ROI |
| Performance | Latência, erro e carga |
| Saúde da sprint | Leitura consolidada |
| Problemas | Pontos que pedem atenção |
| Recomendações | Próximas ações sugeridas |

## Fontes de dados

O serviço pode consultar:

- resultados Allure;
- GitHub Actions;
- banco PostgreSQL;
- métricas k6/InfluxDB;
- RTK Dashboard.

Se uma fonte não estiver disponível, o relatório pode ficar parcial.

## Exportação PowerPoint

A exportação é útil para cerimônias, acompanhamento gerencial e compartilhamento com stakeholders. Antes de enviar, revise:

- período selecionado;
- métricas principais;
- problemas destacados;
- recomendações;
- se há dados faltando por falha de coleta.

## Troubleshooting

| Problema | O que verificar |
|---|---|
| Dashboard não abre | container, porta 3200, logs |
| Relatório não gera | datas, fonte de dados, GitHub token |
| PowerPoint não baixa | logs do serviço e endpoint de exportação |
| Dados vazios | Allure/GitHub/RTK sem dados no período |

Comandos úteis:

```bash
docker compose ps -a
docker compose logs -f sprint-reporter
```

