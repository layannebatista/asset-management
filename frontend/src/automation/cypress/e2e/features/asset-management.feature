# language: pt
# Este arquivo replica o feature compartilhado para execução pelo Cypress.
# Feature canônica em: ../../shared/features/asset-management.feature

Funcionalidade: Gestão de Ativos
  Como usuário do sistema de gestão de ativos
  Quero gerenciar o ciclo de vida dos ativos organizacionais
  Para manter o controle e rastreabilidade do patrimônio

  Contexto:
    Dado que estou autenticado como administrador
    E estou na página de ativos

  Cenário: Listar ativos com colunas visíveis
    Então devo ver a lista de ativos
    E devo ver as colunas "Código do Ativo", "Modelo", "Tipo", "Status", "Ações"

  Cenário: Filtrar ativos por status disponível
    Quando filtro os ativos por status "Disponível"
    Então devo ver apenas ativos com status disponível

  Cenário: Filtrar ativos por status atribuído
    Quando filtro os ativos por status "Atribuído"
    Então devo ver apenas ativos com status atribuído

  Cenário: Buscar ativo por modelo
    Quando busco por "Notebook"
    Então devo ver ativos que correspondem à busca

  Cenário: Criar novo ativo com sucesso
    Quando clico no botão "Novo Ativo"
    E preencho o tipo de ativo com "NOTEBOOK"
    E preencho o modelo do ativo com "Dell Latitude 5520"
    E seleciono a primeira unidade disponível
    E confirmo a criação do ativo
    Então o modal de criação deve ser fechado

  Cenário: Validar campos obrigatórios ao criar ativo
    Quando clico no botão "Novo Ativo"
    E confirmo a criação do ativo sem preencher os campos
    Então o formulário não deve ser enviado

  Cenário: Visualizar detalhes de um ativo
    Quando clico em "Ver detalhes" do primeiro ativo da lista
    Então devo estar na página de detalhes do ativo
    E devo ver as informações básicas do ativo

  Cenário: Navegar para aba de depreciação
    Quando clico em "Ver detalhes" do primeiro ativo da lista
    E clico na aba de depreciação
    Então devo ver as informações de depreciação

  Cenário: Navegar para aba de histórico
    Quando clico em "Ver detalhes" do primeiro ativo da lista
    E clico na aba de histórico
    Então devo ver o histórico do ativo

  Cenário: Atribuir usuário a ativo disponível
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Atribuir usuário" do primeiro ativo disponível
    E seleciono o primeiro usuário disponível
    E confirmo a atribuição
    Então o modal de atribuição deve ser fechado

  Cenário: Solicitar manutenção para ativo
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Abrir manutenção" do primeiro ativo disponível
    E preencho a descrição da manutenção com "Teclado com teclas danificadas - necessita substituição urgente"
    E confirmo a solicitação de manutenção
    Então o modal de manutenção deve ser fechado

  Cenário: Validar descrição mínima de manutenção
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Abrir manutenção" do primeiro ativo disponível
    E preencho a descrição da manutenção com "Curto"
    Então devo ver aviso de mínimo de caracteres

  Cenário: Solicitar transferência de ativo
    Dado que filtro os ativos por status "Disponível"
    Quando clico em "Solicitar transferência" do primeiro ativo disponível
    E seleciono a primeira unidade de destino disponível
    E preencho o motivo da transferência com "Redistribuição de recursos entre departamentos da organização"
    E confirmo a solicitação de transferência
    Então o modal de transferência deve ser fechado

  Cenário: Operador não pode criar ativos
    Dado que estou autenticado como operador
    E estou na página de ativos
    Então não devo ver o botão "Novo Ativo"

  Cenário: Exportar CSV da lista de ativos
    Quando clico no botão "Exportar CSV"
    Então o download do arquivo deve ser iniciado
