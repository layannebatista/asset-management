# language: pt

@frontend @playwright
@allure.label.epic:Frontend
@allure.label.feature:Gestão_de_Transferências_(E2E)

Funcionalidade: Gestão de Transferências (E2E)

  Como administrador do sistema
  Quero operar a tela dedicada de transferências
  Para garantir que o fluxo completo funcione no frontend integrado ao backend

  Contexto:
    Dado que acesso a página de transferências como administrador

  @allure.label.story:Listagem_de_transferências
  @allure.label.severity:normal
  Cenário: Exibir tela de transferências com ações principais
    Então devo ver a tela de transferências carregada
    E devo ver o botão "Nova Solicitação" na tela de transferências

  @allure.label.story:Validação_de_formulário
  @allure.label.severity:normal
  Cenário: Validar motivo mínimo ao criar transferência pela tela dedicada
    Quando abro o formulário de nova transferência
    E seleciono o primeiro ativo disponível na nova transferência
    E seleciono a primeira unidade de destino na nova transferência
    E preencho o motivo da nova transferência com "Curto"
    Então o botão de solicitar transferência deve ficar desabilitado

  @allure.label.story:Transferência_de_ativo
  @allure.label.severity:critical
  Cenário: Criar e cancelar transferência pela tela dedicada
    Quando abro o formulário de nova transferência
    E seleciono o primeiro ativo disponível na nova transferência
    E seleciono a primeira unidade de destino na nova transferência
    E preencho o motivo da nova transferência com um texto único
    E confirmo a nova transferência
    Então devo ver a transferência recém-criada em estado pendente
    Quando cancelo a transferência selecionada
    Então devo ver a transferência selecionada com status "Cancelado"

  @allure.label.story:Transferência_de_ativo
  @allure.label.severity:blocker
  Cenário: Criar, aprovar e concluir transferência pela tela dedicada
    Quando abro o formulário de nova transferência
    E seleciono o primeiro ativo disponível na nova transferência
    E seleciono a primeira unidade de destino na nova transferência
    E preencho o motivo da nova transferência com um texto único
    E confirmo a nova transferência
    Então devo ver a transferência recém-criada em estado pendente
    Quando aprovo a transferência selecionada
    Então devo ver a transferência selecionada com status "Aprovado"
    Quando confirmo o recebimento da transferência selecionada
    Então devo ver a transferência selecionada com status "Concluído"

  @allure.label.story:Transferência_de_ativo
  @allure.label.severity:normal
  Cenário: Criar e rejeitar transferência pela tela dedicada
    Quando abro o formulário de nova transferência
    E seleciono o primeiro ativo disponível na nova transferência
    E seleciono a primeira unidade de destino na nova transferência
    E preencho o motivo da nova transferência com um texto único
    E confirmo a nova transferência
    Então devo ver a transferência recém-criada em estado pendente
    Quando rejeito a transferência selecionada
    Então devo ver a transferência selecionada com status "Rejeitado"

  @allure.label.story:Filtros_de_transferência
  @allure.label.severity:normal
  Cenário: Filtrar transferências por status Pendente
    Quando filtro as transferências por status "Pendente"
    Então devo ver apenas transferências com status "Pendente"

  @allure.label.story:Detalhe_de_transferência
  @allure.label.severity:normal
  Cenário: Detalhe da transferência exibe informações completas
    Quando abro o formulário de nova transferência
    E seleciono o primeiro ativo disponível na nova transferência
    E seleciono a primeira unidade de destino na nova transferência
    E preencho o motivo da nova transferência com um texto único
    E confirmo a nova transferência
    Então devo ver a transferência recém-criada em estado pendente
    E devo ver os detalhes da transferência selecionada

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:critical
  Cenário: Botão Aprovar somente visível em transferência PENDING
    Quando abro o formulário de nova transferência
    E seleciono o primeiro ativo disponível na nova transferência
    E seleciono a primeira unidade de destino na nova transferência
    E preencho o motivo da nova transferência com um texto único
    E confirmo a nova transferência
    Então devo ver a transferência recém-criada em estado pendente
    E devo ver o botão de aprovar transferência no painel de detalhe
    Quando cancelo a transferência selecionada
    Então não devo ver o botão de aprovar transferência no painel de detalhe

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:critical
  Cenário: Botão Rejeitar somente visível em transferência PENDING
    Quando abro o formulário de nova transferência
    E seleciono o primeiro ativo disponível na nova transferência
    E seleciono a primeira unidade de destino na nova transferência
    E preencho o motivo da nova transferência com um texto único
    E confirmo a nova transferência
    Então devo ver a transferência recém-criada em estado pendente
    E devo ver o botão de rejeitar transferência no painel de detalhe
    Quando rejeito a transferência selecionada
    Então não devo ver o botão de rejeitar transferência no painel de detalhe

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:critical
  Cenário: Botão Confirmar Recebimento somente visível em transferência APPROVED
    Quando abro o formulário de nova transferência
    E seleciono o primeiro ativo disponível na nova transferência
    E seleciono a primeira unidade de destino na nova transferência
    E preencho o motivo da nova transferência com um texto único
    E confirmo a nova transferência
    Então devo ver a transferência recém-criada em estado pendente
    E não devo ver o botão de confirmar recebimento no painel de detalhe
    Quando aprovo a transferência selecionada
    Então devo ver o botão de confirmar recebimento no painel de detalhe

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:critical
  Cenário: GESTOR pode aprovar e rejeitar transferências
    Dado que acesso a página de transferências como gestor
    Quando abro o formulário de nova transferência
    E seleciono o primeiro ativo disponível na nova transferência
    E seleciono a primeira unidade de destino na nova transferência
    E preencho o motivo da nova transferência com um texto único
    E confirmo a nova transferência
    Então devo ver a transferência recém-criada em estado pendente
    E devo ver o botão de aprovar transferência no painel de detalhe

  @allure.label.story:Segurança
  @allure.label.severity:blocker
  Cenário: OPERADOR não acessa a rota de transferências
    Dado que acesso a página de transferências como operador
    Então devo ser redirecionado para o dashboard ou ver página de acesso negado

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:critical
  Cenário: GESTOR vê apenas transferências da sua unidade
    Dado que acesso a página de transferências como gestor
    Então a lista de transferências deve estar visível ou indicar ausência de registros

  @allure.label.story:Segurança
  @allure.label.severity:blocker
  Cenário: Acesso à página de transferências sem sessão redireciona para login
    Dado que limpo a sessão ativa
    Quando tento navegar para a página de transferências sem autenticação
    Então devo ser redirecionado para o login
