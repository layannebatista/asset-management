# Segurança

Segurança no projeto se apoia em quatro ideias: autenticar bem, autorizar por perfil, respeitar o escopo multi-tenant e registrar ações importantes.

## Autenticação

- Login com e-mail e senha.
- JWT para chamadas autenticadas.
- Refresh token para renovação de sessão.
- MFA quando configurado.
- Logout para encerrar sessão.

Tokens devem ser tratados como segredo. Não registre tokens em logs.

## Autorização

| Perfil | Escopo |
|---|---|
| `ADMIN` | Administração ampla da organização |
| `GESTOR` | Gestão dentro do escopo permitido |
| `OPERADOR` | Ações operacionais limitadas |

Permissão deve ser validada no backend. O frontend pode esconder botões, mas isso não é controle de segurança suficiente.

## Multi-tenant

Toda consulta sensível precisa considerar organização e, quando aplicável, unidade. Um usuário não deve acessar dados de outra organização mesmo que descubra um `id`.

## Senhas e sessões

- Senhas devem ser armazenadas com hash.
- Tokens devem expirar.
- Refresh tokens devem poder ser revogados.
- Ativação de conta deve usar token temporário.

## CORS e HTTP

Em desenvolvimento, o CORS pode ser mais flexível. Em produção, restrinja para os domínios reais do frontend.

Use HTTPS em produção.

## Auditoria

Registre ações como:

- login e logout;
- falha de autenticação relevante;
- criação/alteração/baixa de ativo;
- transferência;
- alteração de usuário ou perfil;
- ações administrativas.

## Checklist para produção

- `JWT_SECRET` forte.
- HTTPS ativo.
- CORS restrito.
- Segredos fora do repositório.
- Backups protegidos.
- Logs sem dados sensíveis.
- Alertas para falhas de login, erro 5xx e indisponibilidade.

