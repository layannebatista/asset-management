# Mapeamento de testes unitários e integração

Este checklist ajuda a escolher o tipo certo de teste no backend.

## Testes unitários

Use quando a regra pode ser testada sem subir a aplicação inteira:

- validação de status de ativo;
- cálculo ou regra de depreciação;
- decisão de permissão simples;
- montagem de resposta;
- tratamento de erro esperado.

## Testes de integração

Use quando a confiança depende de várias partes juntas:

- controller + service + repository;
- migração + entidade + consulta;
- autenticação com filtro de segurança;
- transação que grava histórico;
- consulta paginada com escopo multi-tenant.

## Cenários prioritários

- Login e token.
- Criação e atualização de ativo.
- Transferência com histórico.
- Inventário com divergência.
- Bloqueio de acesso fora do escopo.
- Auditoria de ação sensível.

## Regra prática

Se o bug poderia acontecer por configuração, banco, transação ou segurança Spring, prefira teste de integração. Se é só uma decisão de regra, teste unitário costuma bastar.

