# Sequências principais

Estes fluxos ajudam a entender a ordem das chamadas sem entrar em detalhe de implementação.

## Login

```text
Usuário
  -> Frontend: informa e-mail e senha
  -> API: POST /auth/login
  -> API: valida credenciais
  -> API: retorna token ou solicita MFA
  -> Frontend: guarda sessão e libera navegação
```

## Login com MFA

```text
Usuário
  -> API: login com e-mail/senha
  -> API: gera código MFA
  -> Usuário: informa código
  -> API: valida código
  -> API: retorna token
```

## Cadastro de ativo

```text
Usuário
  -> Frontend: preenche dados do ativo
  -> API: valida perfil e escopo
  -> API: valida campos obrigatórios
  -> Banco: salva ativo
  -> Banco: registra auditoria
  -> Frontend: mostra ativo criado
```

## Transferência de ativo

```text
Solicitante
  -> API: cria pedido de transferência
  -> API: valida ativo, origem e destino
  -> Gestor/Admin: aprova quando exigido
  -> API: atualiza responsável/unidade
  -> API: registra histórico
  -> Frontend: mostra transferência concluída
```

## Inventário

```text
Gestor/Admin
  -> API: abre sessão de inventário
  -> Operador: confere ativos
  -> API: salva status de cada item
  -> API: destaca divergências
  -> Gestor/Admin: encerra sessão
```

## Manutenção

```text
Usuário autorizado
  -> API: registra manutenção
  -> API: valida ativo e status
  -> Banco: salva custo, data e observações
  -> Banco: registra auditoria
```

## Relatório de sprint

```text
Usuário
  -> Sprint Reporter: escolhe período
  -> Sprint Reporter: coleta dados de testes, CI e métricas
  -> Sprint Reporter: monta resumo executivo
  -> Usuário: visualiza dashboard ou baixa PowerPoint
```

## Observabilidade

```text
Backend
  -> expõe métricas via Actuator
Prometheus
  -> coleta métricas periodicamente
Grafana
  -> consulta Prometheus
Usuário
  -> acompanha dashboards e alertas
```

