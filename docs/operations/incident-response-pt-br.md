# Resposta a incidentes

Incidente é qualquer evento que afete disponibilidade, segurança, integridade dos dados ou confiança no sistema.

## Exemplos

- API indisponível.
- Banco fora do ar.
- Login falhando para muitos usuários.
- Vazamento ou suspeita de acesso indevido.
- Dados de ativos inconsistentes.
- Erro em produção após deploy.
- Lentidão forte ou aumento de falhas.

## Prioridade

| Prioridade | Quando usar |
|---|---|
| Alta | Sistema fora do ar, perda de dados, risco de segurança |
| Média | Função importante falhando com contorno possível |
| Baixa | Problema localizado, sem impacto relevante |

## Primeiros passos

1. Confirme o impacto.
2. Preserve logs e evidências.
3. Comunique quem precisa saber.
4. Contenha o problema.
5. Corrija a causa.
6. Valide recuperação.
7. Registre aprendizados.

## Onde olhar

```bash
docker compose ps -a
docker compose logs -f asset-management
docker compose logs -f frontend
docker compose logs -f postgres
```

Também verifique:

- Grafana;
- Prometheus;
- Allure, se o incidente envolver regressão;
- histórico de deploy;
- mudanças recentes no `.env` ou Compose.

## Comunicação

Uma boa atualização deve dizer:

- o que aconteceu;
- quem foi afetado;
- qual é o impacto;
- o que já foi feito;
- próximo passo;
- previsão, se existir.

## Pós-incidente

Após estabilizar:

- registre linha do tempo;
- identifique causa raiz provável;
- liste ações preventivas;
- crie tarefas de correção;
- atualize alertas, testes ou documentação se necessário.

O objetivo não é achar culpado. É reduzir chance de repetição.

