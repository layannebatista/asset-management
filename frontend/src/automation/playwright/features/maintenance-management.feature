# language: pt

@frontend @playwright
@allure.label.epic:Frontend
@allure.label.feature:Gestão_de_Manutenção_(E2E)

Funcionalidade: Gestão de Manutenção (E2E)

  Como administrador do sistema
  Quero operar a tela dedicada de manutenção
  Para garantir que o fluxo de abertura e tratamento das ordens funcione no frontend

  Contexto:
    Dado que acesso a página de manutenção como administrador

  @allure.label.story:Listagem_de_manutenção
  @allure.label.severity:normal
  Cenário: Exibir tela de manutenção com ações principais
    Então devo ver a tela de manutenção carregada
    E devo ver o botão "Abrir Ordem" na tela de manutenção

  @allure.label.story:Validação_de_formulário
  @allure.label.severity:normal
  Cenário: Validar descrição mínima ao abrir manutenção pela tela dedicada
    Quando abro o formulário de nova manutenção
    E seleciono o ativo seeded para validação de manutenção
    E preencho a descrição da nova manutenção com "Curto"
    Então o botão de abrir manutenção deve ficar desabilitado

  @allure.label.story:Manutenção_de_ativo
  @allure.label.severity:critical
  Cenário: Criar e cancelar manutenção pela tela dedicada
    Quando abro o formulário de nova manutenção
    E seleciono o ativo seeded para cancelamento de manutenção
    E preencho a descrição da nova manutenção com um texto único
    E confirmo a nova manutenção
    Então devo ver a manutenção recém-criada com status "Solicitado"
    Quando cancelo a manutenção selecionada
    Então devo ver a manutenção recém-criada com status "Cancelado"

  @allure.label.story:Manutenção_de_ativo
  @allure.label.severity:blocker
  Cenário: Criar, iniciar e concluir manutenção pela tela dedicada
    Quando abro o formulário de nova manutenção
    E seleciono o ativo seeded para fluxo completo de manutenção
    E preencho a descrição da nova manutenção com um texto único
    E confirmo a nova manutenção
    Então devo ver a manutenção recém-criada com status "Solicitado"
    Quando inicio a manutenção selecionada
    Então devo ver a manutenção recém-criada com status "Em Andamento"
    Quando concluo a manutenção selecionada com uma resolução única
    Então devo ver a manutenção recém-criada com status "Concluído"

  @allure.label.story:Filtros_de_manutenção
  @allure.label.severity:normal
  Cenário: Filtrar manutenções por status Solicitado
    Quando filtro as manutenções por status "Solicitado"
    Então devo ver apenas manutenções com status "Solicitado"

  @allure.label.story:Filtros_de_manutenção
  @allure.label.severity:normal
  Cenário: Filtrar manutenções por status Em Andamento
    Quando filtro as manutenções por status "Em Andamento"
    Então devo ver apenas manutenções com status "Em Andamento"

  @allure.label.story:Validação_de_formulário
  @allure.label.severity:normal
  Cenário: Campo resolução obrigatório ao concluir manutenção
    Quando abro o formulário de nova manutenção
    E seleciono o ativo seeded para fluxo completo de manutenção
    E preencho a descrição da nova manutenção com um texto único
    E confirmo a nova manutenção
    Então devo ver a manutenção recém-criada com status "Solicitado"
    Quando inicio a manutenção selecionada
    E abro o modal de conclusão da manutenção selecionada
    Então o botão de concluir deve estar desabilitado sem resolução
