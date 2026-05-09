# Guia da API

A API REST é o ponto de integração do sistema. Em ambiente local ela fica em:

```text
http://localhost:8080
```

A documentação interativa fica em:

```text
http://localhost:8080/swagger-ui.html
```

Use o Swagger sempre que quiser confirmar parâmetros, exemplos e respostas atuais.

## Autenticação

O login retorna um token JWT. Envie esse token nas chamadas protegidas:

```http
Authorization: Bearer <seu-token>
```

Fluxo comum:

1. Chamar login.
2. Receber access token.
3. Usar o token no header `Authorization`.
4. Renovar sessão com refresh token quando necessário.
5. Fazer logout para encerrar a sessão.

## Endpoints públicos

Os endpoints públicos normalmente incluem:

- healthcheck;
- login;
- ativação de conta;
- verificação MFA, quando aplicável;
- documentação Swagger.

Todo o resto deve exigir autenticação.

## Principais áreas da API

| Área | Para que serve |
|---|---|
| Autenticação | Login, MFA, refresh e logout |
| Organizações | Cadastro e administração de tenants |
| Unidades | Estrutura interna da organização |
| Usuários | Contas, perfis e vínculo com unidade |
| Ativos | Cadastro, consulta e atualização de bens |
| Histórico | Responsável, status e trilha de mudanças |
| Transferências | Pedido, aprovação e conclusão de transferência |
| Inventário | Sessões e conferência de ativos |
| Manutenção | Registro de manutenção e custos |
| Categorias | Agrupamento de ativos |
| Auditoria | Consulta de eventos relevantes |
| Exportação | Geração de CSV ou dados para relatório |
| Dashboards | Indicadores resumidos |

## Regras de acesso

- `ADMIN` pode executar ações administrativas.
- `GESTOR` atua dentro do escopo da unidade/organização.
- `OPERADOR` executa ações operacionais permitidas.

Mesmo com token válido, a API deve negar ações fora do escopo do usuário.

## Erros comuns

| Código | Significado comum |
|---|---|
| `400` | Dados inválidos ou regra de negócio violada |
| `401` | Sem token, token inválido ou sessão expirada |
| `403` | Usuário autenticado, mas sem permissão |
| `404` | Registro não encontrado no escopo do usuário |
| `409` | Conflito, como duplicidade ou estado incompatível |
| `500` | Erro inesperado no servidor |

## Boas práticas para consumir a API

- Não grave token em local inseguro.
- Sempre trate `401` redirecionando para login ou renovando sessão.
- Use paginação em listagens grandes.
- Valide dados no frontend, mas mantenha a regra real no backend.
- Não confie em IDs vindos do cliente para definir organização ou permissão.

## Testando rapidamente

1. Suba o ambiente com Docker.
2. Acesse o Swagger.
3. Faça login com um usuário de demonstração.
4. Copie o token.
5. Autorize no Swagger usando `Bearer <token>`.
6. Teste consultas de ativos, usuários e inventários.

