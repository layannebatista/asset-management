# Modelo de ameaças

Este documento lista os riscos mais relevantes e os controles esperados.

## O que proteger

- Contas de usuário.
- Dados de ativos.
- Dados financeiros e centros de custo.
- Histórico e auditoria.
- Segredos de ambiente.
- Banco de dados.
- Relatórios e métricas.

## Principais ameaças

| Risco | Exemplo | Controle |
|---|---|---|
| Roubo de sessão | Token exposto | Expiração, HTTPS, cuidado com logs |
| Acesso indevido | Usuário acessa outra unidade | RBAC e filtro por escopo |
| Alteração indevida | Ativo transferido sem permissão | Validação no backend e auditoria |
| Vazamento | Dump compartilhado com dados reais | Classificação e anonimização |
| Indisponibilidade | API ou banco fora do ar | Healthcheck, logs, backup |
| Segredo exposto | `.env` commitado | `.gitignore`, cofre e revisão |
| Regressão | Mudança quebra regra crítica | Testes automatizados |

## Multi-tenant

O maior risco funcional é vazamento entre organizações. Teste sempre:

- usuário de uma organização tentando acessar dado de outra;
- gestor tentando acessar unidade fora do escopo;
- operador tentando ação administrativa.

## Superfície de ataque

Pontos que merecem atenção:

- endpoints públicos;
- login e MFA;
- upload/exportação, se houver;
- Swagger em ambiente público;
- dashboards com dados sensíveis;
- variáveis de ambiente;
- banco exposto fora da rede esperada.

## Risco residual

Mesmo com controles, sempre sobra algum risco. O objetivo é tornar o risco conhecido, monitorado e aceitável para o contexto do projeto.

## Recomendações

- Revisar permissões ao criar endpoint.
- Adicionar testes de acesso negado.
- Manter dependências atualizadas.
- Não usar credenciais padrão em produção.
- Monitorar falhas de autenticação e erro 5xx.

