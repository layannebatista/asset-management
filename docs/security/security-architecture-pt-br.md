# Arquitetura de segurança

Este documento mostra como as camadas do projeto se protegem.

## Camadas

| Camada | Proteção esperada |
|---|---|
| Navegador | Sessão controlada, sem expor segredos |
| Frontend | UX por perfil, validações básicas |
| API | Autenticação, autorização e regra real |
| Banco | Integridade, chaves e isolamento por escopo |
| Infra | Rede, segredos, HTTPS, backup e logs |

## Fluxo de autenticação

```text
Login
  -> API valida credenciais
  -> API pode exigir MFA
  -> API emite JWT
  -> cliente envia Authorization: Bearer
  -> API valida token a cada chamada
```

## Fluxo de autorização

```text
Requisição autenticada
  -> identifica usuário
  -> identifica perfil
  -> identifica organização/unidade
  -> valida regra da ação
  -> executa ou nega
```

## Isolamento de dados

O ponto crítico é evitar acesso cruzado entre organizações. Para isso:

- consultas devem filtrar por organização/unidade;
- endpoints não devem confiar apenas em IDs enviados pelo cliente;
- operações sensíveis devem registrar auditoria;
- testes devem cobrir cenários de acesso negado.

## Segredos

Segredos incluem:

- JWT secret;
- senhas de banco;
- tokens do GitHub;
- chaves de IA;
- credenciais de e-mail.

Eles devem ficar em `.env`, cofre de segredos ou variáveis do ambiente. Nunca devem ser commitados.

## Monitoramento de segurança

Observe:

- muitas falhas de login;
- aumento de `401` ou `403`;
- erros 5xx em endpoints sensíveis;
- uso anormal de recursos;
- mudanças administrativas fora do padrão.

## Responsabilidade

Segurança não fica em um arquivo só. Toda nova funcionalidade deve responder:

- Quem pode fazer?
- Em qual escopo?
- O que precisa ser auditado?
- Que dado sensível está envolvido?
- Como testar acesso permitido e negado?

