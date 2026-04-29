# language: pt

@frontend @playwright
@allure.label.epic:Frontend
@allure.label.feature:Gestão_de_Ativos_(E2E)

Funcionalidade: Gestão de Ativos (E2E)

  Como usuário do sistema de gestão de ativos
  Quero executar fluxos completos do sistema
  Para garantir que frontend e backend funcionam juntos

  Contexto:
    Dado que estou autenticado como administrador
    E estou na página de ativos

  @allure.label.story:Listagem_de_ativos
  @allure.label.severity:normal
  Cenário: Listar ativos com colunas visíveis
    Então devo ver a lista de ativos
    E devo ver as colunas "Código do Ativo", "Modelo", "Tipo", "Status", "Ações"

  @allure.label.story:Filtros
  @allure.label.severity:normal
  Cenário: Filtrar ativos por status disponível
    Quando filtro os ativos por status "Disponível"
    Então devo ver apenas ativos com status disponível

  @allure.label.story:Filtros
  @allure.label.severity:normal
  Cenário: Filtrar ativos por status atribuído
    Quando filtro os ativos por status "Atribuído"
    Então devo ver apenas ativos com status atribuído

  @allure.label.story:Filtros
  @allure.label.severity:normal
  @flaky
  Cenário: Buscar ativo por modelo
    Quando busco por "Notebook"
    Então devo ver ativos que correspondem à busca

  @allure.label.story:Validação_de_formulário
  @allure.label.severity:normal
  Cenário: Validar campos obrigatórios ao criar ativo
    Quando clico no botão "Novo Ativo"
    E confirmo a criação do ativo sem preencher os campos
    Então o formulário não deve ser enviado

  @allure.label.story:Validação_de_formulário
  @allure.label.severity:normal
  Cenário: Validar descrição mínima de manutenção
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Abrir manutenção" do primeiro ativo disponível
    E preencho a descrição da manutenção com "Curto"
    Então devo ver aviso de mínimo de caracteres

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:critical
  Cenário: Operador não pode criar ativos
    Dado que estou autenticado como operador
    E estou na página de ativos
    Então não devo ver o botão "Novo Ativo"

  @allure.label.story:Criação_de_ativo
  @allure.label.severity:critical
  Cenário: Criar novo ativo com sucesso
    Quando clico no botão "Novo Ativo"
    E preencho o tipo de ativo com "NOTEBOOK"
    E preencho o modelo do ativo com um nome único
    E seleciono a primeira unidade disponível
    E confirmo a criação do ativo
    Então o modal de criação deve ser fechado
    E o ativo deve aparecer na lista

  @allure.label.story:Detalhes_do_ativo
  @allure.label.severity:normal
  Cenário: Visualizar detalhes de um ativo
    Quando clico em "Ver detalhes" do primeiro ativo da lista
    Então devo estar na página de detalhes do ativo
    E devo ver as informações básicas do ativo

  @allure.label.story:Detalhes_do_ativo
  @allure.label.severity:normal
  Cenário: Navegar para aba de depreciação
    Quando clico em "Ver detalhes" do primeiro ativo da lista
    E clico na aba de depreciação
    Então devo ver as informações de depreciação

  @allure.label.story:Detalhes_do_ativo
  @allure.label.severity:normal
  Cenário: Navegar para aba de histórico
    Quando clico em "Ver detalhes" do primeiro ativo da lista
    E clico na aba de histórico
    Então devo ver o histórico do ativo

  @allure.label.story:Atribuição_de_ativo
  @allure.label.severity:critical
  Cenário: Atribuir usuário a ativo disponível
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Atribuir usuário" do primeiro ativo disponível
    E seleciono o primeiro usuário disponível
    E confirmo a atribuição
    Então o modal de atribuição deve ser fechado

  @allure.label.story:Manutenção_de_ativo
  @allure.label.severity:critical
  Cenário: Solicitar manutenção para ativo
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Abrir manutenção" do primeiro ativo disponível
    E preencho a descrição da manutenção com "Teclado com teclas danificadas - necessita substituição urgente"
    E confirmo a solicitação de manutenção
    Então o modal de manutenção deve ser fechado

  @allure.label.story:Transferência_de_ativo
  @allure.label.severity:normal
  Cenário: Solicitar transferência de ativo
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Solicitar transferência" do primeiro ativo disponível
    E seleciono a primeira unidade de destino disponível
    E preencho o motivo da transferência com "Redistribuição de recursos entre departamentos da organização"
    E confirmo a solicitação de transferência
    Então o modal de transferência deve ser fechado

  @allure.label.story:Exportação
  @allure.label.severity:normal
  Cenário: Exportar CSV da lista de ativos
    Quando clico no botão "Exportar CSV"
    Então o download do arquivo deve ser iniciado

  @allure.label.story:Filtros
  @allure.label.severity:normal
  Cenário: Filtrar ativos por tipo Notebook
    Quando seleciono o tipo "Notebook" no filtro de tipo
    Então devo ver apenas ativos do tipo notebook na lista

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:normal
  Cenário: Botão "Novo Ativo" visível para GESTOR
    Dado que estou autenticado como gestor
    E estou na página de ativos
    Então devo ver o botão "Novo Ativo"

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:critical
  Cenário: ADMIN vê botão de aposentar ativo disponível
    Dado que filtro os ativos por status "Disponível"
    Então devo ver o botão de aposentar no primeiro ativo disponível

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:critical
  Cenário: GESTOR não vê botão de aposentar ativo
    Dado que estou autenticado como gestor
    E estou na página de ativos
    Dado que filtro os ativos por status "Disponível"
    Então não devo ver o botão "Aposentar ativo" na lista

  @allure.label.story:Atribuição_de_ativo
  @allure.label.severity:critical
  Cenário: Desatribuir ativo ASSIGNED
    Dado que filtro os ativos por status "Atribuído"
    Quando clico em "Desatribuir usuário" do primeiro ativo atribuído
    Então o modal de desatribuição deve ser fechado
    E o ativo deve retornar ao status disponível

  @allure.label.story:Aposentadoria_de_ativo
  @allure.label.severity:critical
  Cenário: Aposentar ativo com digitação correta do código
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Aposentar ativo" do ativo seeded para aposentadoria
    E digito o código do ativo no modal de confirmação
    E confirmo a aposentadoria
    Então o modal de aposentadoria deve ser fechado

  @allure.label.story:Aposentadoria_de_ativo
  @allure.label.severity:normal
  Cenário: Aposentar ativo bloqueado com digitação incorreta
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Aposentar ativo" do ativo seeded para aposentadoria
    E digito um código incorreto no modal de confirmação
    Então o botão de confirmar aposentadoria deve ficar desabilitado

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:critical
  Cenário: Asset RETIRED não exibe ações de mudança de estado
    Dado que filtro os ativos por status "Aposentado"
    Então não devo ver ações de atribuir manutenção ou transferência na linha

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:critical
  Cenário: Operador acessa lista escopada por seu userId
    Dado que estou autenticado como operador
    E estou na página de ativos
    Então a lista de ativos deve conter apenas ativos do operador ou estado vazio

  @allure.label.story:Controle_de_acesso
  @allure.label.severity:critical
  Cenário: Gestor acessa lista escopada por unitId
    Dado que estou autenticado como gestor
    E estou na página de ativos
    Então a lista de ativos deve estar filtrada pela unidade do gestor

  @allure.label.story:Segurança
  @allure.label.severity:blocker
  Cenário: Acesso à página de ativos sem sessão redireciona para login
    Dado que limpo a sessão ativa
    Quando tento navegar para a página de ativos sem autenticação
    Então devo ser redirecionado para o login

  @allure.label.story:Filtros
  @allure.label.severity:critical
  Cenário: URL com parâmetros aplica filtros na listagem
    Dado que a API de ativos valida os parâmetros de URL status "ASSIGNED" unitId "11" assignedUserId "77" e type "NOTEBOOK"
    Quando acesso a página de ativos com a URL "/assets?status=ASSIGNED&unitId=11&assignedUserId=77&type=NOTEBOOK"
    Então devo ver o ativo mockado filtrado pela URL
    E não devo ver as colunas "Unidade" e "Responsável" na listagem

  @allure.label.story:Seguros
  @allure.label.severity:critical
  Cenário: Modo insurance exibe apenas ativos com apólice a vencer
    Dado que a listagem de ativos no modo insurance está mockada
    Quando acesso a página de ativos com a URL "/assets?insurance=expiring"
    Então devo ver o banner do modo insurance
    E devo ver a coluna "Seguro" na listagem
    E devo ver apenas ativos com apólice a vencer na listagem

  @allure.label.story:Controle_de_estado
  @allure.label.severity:critical
  Cenário: Ações disponíveis variam conforme o status do ativo
    Dado que a listagem de ativos com múltiplos status está mockada
    Quando acesso a página de ativos com a URL "/assets"
    Então devo ver as ações corretas para cada status de ativo

  @allure.label.story:Segurança
  @allure.label.severity:critical
  Cenário: Erro 403 em operação de ativo exibe mensagem correta
    Dado que a operação de desatribuição de ativo responde 403
    Quando tento remover a atribuição do ativo bloqueado
    Então devo ver a mensagem de erro de ativo "Acesso negado para remover atribuição"
