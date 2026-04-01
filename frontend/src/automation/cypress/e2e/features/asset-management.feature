# language: pt
# Projeto: Patrimônio 360
# Domínio: Gestão de Ativos — Interface Web (E2E)
# Executar com: npm test (dentro de frontend/src/automation/cypress)

@allure.label.parentSuite:Frontend
@allure.label.epic:Gestão de Ativos
Funcionalidade: Gestão de Ativos — Interface Web
  Como usuário do sistema de gestão de ativos
  Quero gerenciar o ciclo de vida dos ativos organizacionais
  Para manter o controle e rastreabilidade do patrimônio

  Contexto:
    Dado que estou autenticado como administrador
    E estou na página de ativos

  # ─── Listagem e Busca ──────────────────────────────────────────────────────

  @listagem
  @allure.label.suite:Listagem e Busca
  @allure.severity.normal
  Cenário: [Listagem] Exibe tabela de ativos com colunas corretas
    Verifica que a tabela principal de ativos está visível e contém as cinco colunas
    esperadas. Este teste garante que o layout básico da tela não foi quebrado por
    alterações no frontend.
    Então devo ver a lista de ativos
    E devo ver as colunas "Código do Ativo", "Modelo", "Tipo", "Status", "Ações"

  @listagem @filtro
  @allure.label.suite:Listagem e Busca
  @allure.severity.normal
  Cenário: [Filtro] Filtrar ativos por status Disponível exibe apenas ativos disponíveis
    Verifica que o filtro por status funciona corretamente para o status "Disponível".
    Após aplicar o filtro, todas as linhas da tabela devem exibir o badge "Disponível",
    confirmando que a query de filtragem no backend está sendo chamada corretamente.
    Quando filtro os ativos por status "Disponível"
    Então devo ver apenas ativos com status disponível

  @listagem @filtro
  @allure.label.suite:Listagem e Busca
  @allure.severity.normal
  Cenário: [Filtro] Filtrar ativos por status Atribuído exibe apenas ativos atribuídos
    Verifica que o filtro por status funciona para ativos "Atribuídos" (em uso por um usuário).
    Todos os resultados devem ter o badge correspondente, validando o filtro da API.
    Quando filtro os ativos por status "Atribuído"
    Então devo ver apenas ativos com status atribuído

  @listagem @busca
  @allure.label.suite:Listagem e Busca
  @allure.severity.normal
  Cenário: [Busca] Buscar por modelo retorna ativos correspondentes
    Verifica que o campo de busca livre filtra ativos pelo modelo informado.
    O resultado deve exibir ativos relacionados ao termo buscado ou a mensagem de
    "nenhum resultado encontrado" caso não haja correspondência.
    Quando busco por "Notebook"
    Então devo ver ativos que correspondem à busca

  # ─── Criação de Ativo ──────────────────────────────────────────────────────

  @criacao
  @allure.label.suite:Criação de Ativo
  @allure.severity.critical
  Cenário: [Criação] Criar novo ativo com dados válidos fecha o modal com sucesso
    Verifica o fluxo completo de criação de ativo pela interface:
    abrir modal → preencher tipo, modelo e unidade → confirmar.
    Após o sucesso, o modal deve ser fechado e a tabela atualizada.
    Quando clico no botão "Novo Ativo"
    E preencho o tipo de ativo com "NOTEBOOK"
    E preencho o modelo do ativo com "Dell Latitude 5520"
    E seleciono a primeira unidade disponível
    E confirmo a criação do ativo
    Então o modal de criação deve ser fechado

  @criacao @validacao
  @allure.label.suite:Criação de Ativo
  @allure.severity.normal
  Cenário: [Validação] Confirmar criação sem preencher campos obrigatórios não envia o formulário
    Verifica que o formulário de criação realiza validação no frontend antes de enviar
    para a API. Com campos obrigatórios vazios, o modal deve permanecer aberto e o
    formulário não deve ser submetido.
    Quando clico no botão "Novo Ativo"
    E confirmo a criação do ativo sem preencher os campos
    Então o formulário não deve ser enviado

  # ─── Detalhes do Ativo ─────────────────────────────────────────────────────

  @detalhes
  @allure.label.suite:Detalhes do Ativo
  @allure.severity.normal
  Cenário: [Detalhes] Acessar página de detalhes exibe informações básicas do ativo
    Verifica que ao clicar em "Ver detalhes", o usuário é redirecionado para a página
    de detalhes do ativo (rota /assets/:id) e que as informações básicas como código
    e modelo estão visíveis.
    Quando clico em "Ver detalhes" do primeiro ativo da lista
    Então devo estar na página de detalhes do ativo
    E devo ver as informações básicas do ativo

  @detalhes @depreciacao
  @allure.label.suite:Detalhes do Ativo
  @allure.severity.minor
  Cenário: [Depreciação] Aba de depreciação exibe dados financeiros do ativo
    Verifica que a aba de depreciação está acessível e renderiza os dados de
    desvalorização do ativo (método linear, saldo residual, etc.). Esta funcionalidade
    depende do cadastro de dados financeiros no ativo.
    Quando clico em "Ver detalhes" do primeiro ativo da lista
    E clico na aba de depreciação
    Então devo ver as informações de depreciação

  @detalhes @historico
  @allure.label.suite:Detalhes do Ativo
  @allure.severity.minor
  Cenário: [Histórico] Aba de histórico exibe o histórico de eventos do ativo
    Verifica que a aba de histórico está acessível e exibe o registro cronológico
    de eventos do ativo (atribuições, manutenções, transferências, etc.).
    Este log é essencial para auditoria e rastreabilidade do patrimônio.
    Quando clico em "Ver detalhes" do primeiro ativo da lista
    E clico na aba de histórico
    Então devo ver o histórico do ativo

  # ─── Atribuição de Usuário ─────────────────────────────────────────────────

  @atribuicao
  @allure.label.suite:Atribuição de Usuário
  @allure.severity.critical
  Cenário: [Atribuição] Atribuir usuário a ativo disponível fecha o modal com sucesso
    Verifica o fluxo de atribuição de ativo a um usuário pela interface:
    filtrar disponíveis → clicar em "Atribuir usuário" → selecionar usuário → confirmar.
    Após o sucesso, o modal fecha e o ativo muda para status "Atribuído".
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Atribuir usuário" do primeiro ativo disponível
    E seleciono o primeiro usuário disponível
    E confirmo a atribuição
    Então o modal de atribuição deve ser fechado

  # ─── Manutenção ────────────────────────────────────────────────────────────

  @manutencao
  @allure.label.suite:Solicitação de Manutenção
  @allure.severity.critical
  Cenário: [Manutenção] Solicitar manutenção com descrição válida fecha o modal com sucesso
    Verifica o fluxo de abertura de manutenção pelo frontend:
    filtrar disponíveis → clicar em "Abrir manutenção" → preencher descrição → confirmar.
    A descrição deve ter no mínimo 10 caracteres para ser aceita pela API.
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Abrir manutenção" do primeiro ativo disponível
    E preencho a descrição da manutenção com "Teclado com teclas danificadas - necessita substituição urgente"
    E confirmo a solicitação de manutenção
    Então o modal de manutenção deve ser fechado

  @manutencao @validacao
  @allure.label.suite:Solicitação de Manutenção
  @allure.severity.normal
  Cenário: [Validação] Descrição de manutenção abaixo do mínimo exibe aviso de caracteres
    Verifica que o frontend aplica validação de comprimento mínimo na descrição da
    manutenção antes de enviar à API. Com menos de 10 caracteres, deve aparecer
    uma mensagem de aviso informando o mínimo exigido.
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Abrir manutenção" do primeiro ativo disponível
    E preencho a descrição da manutenção com "Curto"
    Então devo ver aviso de mínimo de caracteres

  # ─── Transferência ─────────────────────────────────────────────────────────

  @transferencia
  @allure.label.suite:Solicitação de Transferência
  @allure.severity.critical
  Cenário: [Transferência] Solicitar transferência com motivo válido fecha o modal com sucesso
    Verifica o fluxo de solicitação de transferência de ativo entre unidades:
    filtrar disponíveis → clicar em "Solicitar transferência" → selecionar unidade destino
    → preencher motivo → confirmar. O motivo deve ter no mínimo 10 caracteres.
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Solicitar transferência" do primeiro ativo disponível
    E seleciono a primeira unidade de destino disponível
    E preencho o motivo da transferência com "Redistribuição de recursos entre departamentos da organização"
    E confirmo a solicitação de transferência
    Então o modal de transferência deve ser fechado

  # ─── Controle de Acesso ────────────────────────────────────────────────────

  @autorizacao
  @allure.label.suite:Controle de Acesso
  @allure.severity.critical
  Cenário: [Controle de Acesso] Operador não visualiza o botão de criar ativo
    Verifica que o perfil OPERADOR não tem acesso ao botão "Novo Ativo" na interface.
    O controle de visibilidade deve estar implementado no frontend com base na role
    retornada pelo token JWT. Este teste protege contra exposição acidental de
    funcionalidades restritas.
    Dado que estou autenticado como operador
    E estou na página de ativos
    Então não devo ver o botão "Novo Ativo"

  # ─── Exportação ────────────────────────────────────────────────────────────

  @exportacao
  @allure.label.suite:Exportação
  @allure.severity.minor
  Cenário: [Exportação] Exportar CSV inicia download do arquivo
    Verifica que o botão "Exportar CSV" dispara corretamente a requisição ao endpoint
    de exportação da API. O teste intercepta a chamada e valida que a resposta foi
    recebida com sucesso (200 ou 204).
    Quando clico no botão "Exportar CSV"
    Então o download do arquivo deve ser iniciado
