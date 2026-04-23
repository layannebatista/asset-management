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

  @allure.label.story:Manutenção_de_ativo
  @allure.label.severity:critical
  Cenário: Cancelar manutenção que está em andamento
    Quando abro o formulário de nova manutenção
    E seleciono o ativo seeded para cancelamento de manutenção em andamento
    E preencho a descrição da nova manutenção com um texto único
    E confirmo a nova manutenção
    Então devo ver a manutenção recém-criada com status "Solicitado"
    Quando inicio a manutenção selecionada
    Então devo ver a manutenção recém-criada com status "Em Andamento"
    Quando cancelo a manutenção selecionada
    Então devo ver a manutenção recém-criada com status "Cancelado"

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:critical
  Cenário: GESTOR acessa manutenção escopada por sua unidade
    Dado que acesso a página de manutenção como gestor
    Então a lista de manutenção deve estar visível ou indicar ausência de registros

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:critical
  Cenário: OPERADOR acessa manutenção escopada por suas solicitações
    Dado que acesso a página de manutenção como operador
    Então a lista de manutenção deve estar visível ou indicar ausência de registros

  @allure.label.story:Segurança
  @allure.label.severity:blocker
  Cenário: Acesso à página de manutenção sem sessão redireciona para login
    Dado que limpo a sessão ativa
    Quando tento navegar para a página de manutenção sem autenticação
    Então devo ser redirecionado para o login

  @allure.label.story:Segurança
  @allure.label.severity:critical
  Cenário: Erro 403 em ação de manutenção exibe feedback
    Dado que a listagem de manutenção contém uma ordem bloqueada para iniciar
    Quando tento iniciar a ordem de manutenção bloqueada
    Então devo ver a mensagem de erro de manutenção "Acesso negado para iniciar manutenção"
