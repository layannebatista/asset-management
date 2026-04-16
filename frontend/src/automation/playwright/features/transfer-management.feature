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
