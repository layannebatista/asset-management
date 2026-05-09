# Classificação de dados

Classificar dados ajuda a decidir quem pode acessar, como armazenar e como compartilhar informações.

## Níveis

| Nível | Exemplos | Cuidado |
|---|---|---|
| Público | Documentação pública, informações genéricas | Pode ser compartilhado |
| Interno | Métricas técnicas, nomes de módulos | Compartilhar dentro do time |
| Confidencial | Usuários, e-mails, ativos, unidades, custos | Acesso por necessidade |
| Restrito | Senhas, tokens, segredos, dados sensíveis de segurança | Máxima proteção |

## Dados do sistema

| Dado | Classificação |
|---|---|
| Cadastro de ativo | Confidencial |
| Valor de ativo | Confidencial |
| Responsável do ativo | Confidencial |
| E-mail de usuário | Confidencial |
| Senha | Restrito |
| JWT/refresh token | Restrito |
| Logs técnicos sem dado pessoal | Interno |
| Métricas agregadas | Interno |

## Regras práticas

- Não logue senha, token ou segredo.
- Não exponha dados de outra organização.
- Não use dump real em ambiente público.
- Mascarar ou anonimizar dados quando possível.
- Compartilhar somente o necessário para a tarefa.

## Retenção

Defina por tipo de dado:

- quanto tempo manter;
- quem pode acessar;
- quando apagar;
- como auditar acesso.

## Desenvolvimento

Para testes e demonstrações, prefira dados fictícios. Se usar dados reais, remova informações pessoais e valores sensíveis antes de compartilhar.

