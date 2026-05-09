# RTK - guia unificado

RTK é usado neste projeto para apoiar fluxos com IA e acompanhar economia de tokens. A ideia é reduzir custo e ruído sem depender de processamento externo para o dashboard local.

## Quando usar

- Para medir economia de tokens.
- Para comparar eficiência entre modelos.
- Para acompanhar ROI de análises.
- Para alimentar dashboards executivos.

## Instalação local

No Windows/PowerShell:

```powershell
.\scripts\install-rtk.ps1
Get-Command rtk
```

Se o comando não aparecer, feche e reabra o terminal.

## Integração com ferramentas de IA

O RTK pode apoiar ferramentas como Claude Code, Cursor, Copilot, Gemini CLI, Codeium e OpenCode. A regra prática é manter a integração simples:

- instalar o comando;
- confirmar que está no PATH;
- usar os scripts do repositório;
- validar no RTK Dashboard.

## Dashboard

O dashboard local fica em:

```text
http://localhost:3100
```

Ele mostra economia, eficiência e ROI.

## Cuidados

- Não trate números de economia como contabilidade financeira perfeita.
- Use como indicador de tendência e comparação.
- Valide se há dados reais antes de tirar conclusão.
- Se o dashboard mostrar zero, pode significar falta de coleta no período.

