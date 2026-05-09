# Mapeamento de cenários backend

Use este documento como checklist de cobertura de negócio no backend.

## Autenticação

- Login com credenciais válidas.
- Login com senha inválida.
- Token expirado.
- Refresh token válido e inválido.
- Logout revogando sessão.

## Autorização

- `ADMIN` acessa funções administrativas.
- `GESTOR` acessa apenas seu escopo.
- `OPERADOR` não executa ação administrativa.
- Usuário não acessa dados de outra organização.

## Ativos

- Criar ativo válido.
- Bloquear ativo com campos obrigatórios ausentes.
- Atualizar ativo dentro do escopo.
- Registrar histórico ao trocar responsável.
- Registrar histórico ao trocar status.
- Bloquear alteração fora do escopo.

## Transferências

- Criar pedido de transferência.
- Aprovar transferência.
- Recusar transferência.
- Bloquear transferência de ativo inexistente ou fora do escopo.
- Registrar histórico ao concluir.

## Inventário

- Criar sessão.
- Adicionar item encontrado.
- Registrar divergência.
- Encerrar sessão.
- Bloquear alteração em sessão encerrada.

## Manutenção

- Registrar manutenção.
- Validar custo e datas.
- Listar histórico por ativo.

## Auditoria

- Registrar eventos sensíveis.
- Consultar auditoria respeitando escopo.

