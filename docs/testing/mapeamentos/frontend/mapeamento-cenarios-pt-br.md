# Mapeamento de cenários frontend

Os testes de frontend devem cobrir fluxos reais do usuário, não detalhes internos de componente.

## Login

- Usuário entra com credenciais válidas.
- Mensagem aparece para credenciais inválidas.
- Sessão expirada redireciona para login.

## Ativos

- Listar ativos.
- Filtrar ou buscar ativo.
- Criar ativo.
- Editar ativo.
- Ver detalhes e histórico.
- Mostrar erro quando API negar ação.

## Transferências

- Solicitar transferência.
- Exibir status da solicitação.
- Validar campos obrigatórios.

## Inventário

- Abrir sessão.
- Marcar ativo encontrado.
- Registrar divergência.
- Encerrar sessão.

## Acessibilidade e estabilidade

- Botões principais devem ter nome acessível.
- Use `data-testid` para seletores estáveis.
- Evite depender de texto que muda muito.
- Espere a tela carregar antes de interagir.

