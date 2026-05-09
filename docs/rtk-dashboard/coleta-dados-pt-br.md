# Coleta de dados do RTK Dashboard

O dashboard não cria economia sozinho. Ele lê registros gerados por fluxos que usam RTK e transforma esses dados em indicadores.

## Fluxo

```text
Ferramenta/serviço usa RTK
  -> registra consumo e economia
  -> dados ficam disponíveis para consulta
  -> API do RTK Dashboard agrega indicadores
  -> frontend exibe gráficos e resumo
```

## Dados usados

O dashboard pode considerar:

- tokens antes da otimização;
- tokens depois da otimização;
- modelo utilizado;
- tipo de análise;
- custo estimado;
- qualidade/resultado;
- data da execução.

## Dados reais versus exemplo

Dados reais vêm de execuções registradas. Dados de exemplo servem apenas para demonstrar a interface.

Antes de usar em apresentação, valide se o período contém dados reais.

## Frequência

A atualização depende de quando os registros são gravados e de como o frontend consulta a API. Se acabou de rodar uma análise, talvez seja necessário atualizar a tela.

## APIs úteis

```text
http://localhost:3100/health
http://localhost:3100/api/v1/insights/token-economy
http://localhost:3100/api/v1/insights/model-efficiency
http://localhost:3100/api/v1/insights/analysis-roi
```

## Se aparecer zero

Pode significar:

- não houve coleta no período;
- a integração RTK não registrou dados;
- o serviço não está conectado à fonte correta;
- o dashboard está consultando outro ambiente.

