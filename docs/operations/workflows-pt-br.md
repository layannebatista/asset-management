# Fluxos de trabalho

Este documento descreve os caminhos mais importantes do sistema no dia a dia.

## Login

1. Usuário informa e-mail e senha.
2. API valida credenciais.
3. Se MFA estiver ativo, usuário informa o código.
4. API retorna token.
5. Frontend libera as telas conforme perfil.

## Cadastro de ativo

1. Usuário autorizado abre cadastro.
2. Preenche identificação, unidade, categoria, responsável e dados financeiros.
3. API valida campos obrigatórios e escopo.
4. Ativo é criado.
5. Auditoria registra a ação.

## Atualização de ativo

1. Usuário altera dados permitidos.
2. API valida permissão e estado atual.
3. Mudanças relevantes geram histórico.
4. Auditoria registra a alteração.

## Transferência

1. Usuário solicita transferência.
2. API valida origem, destino e ativo.
3. Quando necessário, gestor/admin aprova.
4. Sistema atualiza unidade/responsável.
5. Histórico de transferência e auditoria são registrados.

## Inventário

1. Gestor/admin cria sessão de inventário.
2. Operadores conferem ativos.
3. Cada item recebe status: encontrado, divergente ou pendente.
4. Divergências são revisadas.
5. Sessão é encerrada.

## Manutenção

1. Usuário autorizado cria registro de manutenção.
2. Informa data, custo, descrição e status.
3. Sistema salva o histórico.
4. Relatórios podem usar esses dados para custo total do ativo.

## Baixa ou aposentadoria

1. Usuário autorizado solicita baixa.
2. API valida se o ativo pode ser baixado.
3. Status muda para aposentado/baixado.
4. Sistema registra histórico e auditoria.

## Exportação

1. Usuário aplica filtros.
2. API valida escopo.
3. Sistema gera arquivo ou resposta com os dados permitidos.

## Relatório de sprint

1. Usuário acessa o Sprint Reporter.
2. Escolhe período.
3. Serviço coleta dados de testes, CI, performance e RTK.
4. Dashboard mostra resumo.
5. Usuário baixa PowerPoint se quiser apresentar.

