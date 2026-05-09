# Migração para RTK

Use este guia quando quiser organizar ou migrar fluxos de IA para usar RTK e aparecer no dashboard.

## Objetivo

- Padronizar o uso de RTK.
- Registrar economia de tokens.
- Facilitar comparação entre modelos e tipos de análise.
- Alimentar relatórios executivos.

## Passos recomendados

1. Instale o RTK.
2. Confirme que o comando está disponível.
3. Escolha um fluxo pequeno para começar.
4. Registre dados de antes e depois.
5. Valide se o dashboard recebeu os dados.
6. Expanda para outros fluxos.

## Validação no Windows

```powershell
.\scripts\install-rtk.ps1
Get-Command rtk
```

## Critérios de sucesso

- O fluxo continua entregando resultado útil.
- O consumo de tokens cai.
- Os dados aparecem no RTK Dashboard.
- A equipe entende como interpretar as métricas.

## Cuidados

- Não sacrifique qualidade só para reduzir token.
- Compare períodos parecidos.
- Documente mudanças relevantes.
- Mantenha fallback caso a integração falhe.

