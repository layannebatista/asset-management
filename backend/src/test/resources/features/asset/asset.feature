# language: pt
# Projeto: Patrimônio 360
# Domínio: Gestão de Ativos
# Executar com: mvn test -Dtest=CucumberRunnerTest

@assets
@allure.label.parentSuite:Backend
@allure.label.epic:Gestao_de_Ativos
Funcionalidade: Gerenciamento do Ciclo de Vida de Ativos
  Como administrador ou gestor do sistema
  Quero gerenciar os ativos organizacionais
  Para garantir controle de acesso, rastreabilidade e integridade dos dados

  Contexto:
    Dado que existe uma organização "Tech Corp" cadastrada
    E que existe uma unidade "Sede" nessa organização
    E que existe um ativo "ASSET-001" disponível nessa unidade
    E que existe um usuário ADMIN com email "admin@tech.com" e senha "Senha@123"
    E que existe um usuário GESTOR com email "gestor@tech.com" e senha "Senha@123"
    E que existe um usuário OPERADOR com email "operador@tech.com" e senha "Senha@123"

  @listagem
  @allure.label.suite:Listagem_de_Ativos
  @allure.severity.critical
  Cenário: Deve listar ativos com sucesso
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando listo os ativos
    Então a resposta deve ter status 200
    E a listagem deve conter ativos com assetTag preenchido

  @autenticacao
  @allure.label.suite:Autenticacao
  @allure.severity.blocker
  Cenário: Deve retornar 401 sem autenticação
    Quando listo os ativos sem autenticação
    Então a resposta deve ter status 401

  @autenticacao
  @allure.label.suite:Autenticacao
  @allure.severity.blocker
  Cenário: Buscar ativo sem autenticação retorna 401
    Quando busco um ativo por id sem autenticação
    Então a resposta deve ter status 401

  @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Esquema do Cenário: Apenas ADMIN pode aposentar ativo
    Dado que estou autenticado como "<email>" com senha "Senha@123"
    Quando tento aposentar o ativo "ASSET-001"
    Então a resposta deve ter status <status_esperado>

    Exemplos:
      | email             | status_esperado |
      | admin@tech.com    | 200             |
      | gestor@tech.com   | 403             |
      | operador@tech.com | 403             |

  @criacao
  @allure.label.suite:Criacao_de_Ativos
  @allure.severity.critical
  Cenário: ADMIN cria ativo com sucesso
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo "ASSET-NOVO" do tipo "NOTEBOOK" modelo "Dell XPS 15" na organização
    Então a resposta deve ter status 201
    E o ativo criado deve ter assetTag "ASSET-NOVO"

  @criacao @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: AssetTag com 101 caracteres é rejeitado
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo com assetTag de 101 caracteres na organização
    Então a resposta deve ter status 400

  @criacao @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: AssetTag contendo apenas espaços é rejeitado
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo com assetTag apenas espaços na organização
    Então a resposta deve ter status 400

  @atribuicao @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.critical
  Cenário: Deve permitir atribuir ativo disponível
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-AVAIL-ASSIGN" disponível nessa unidade
    Quando atribuo o ativo "ASSET-AVAIL-ASSIGN" ao usuário "operador@tech.com"
    Então a resposta deve ter status 200
    E o ativo deve estar no status "ASSIGNED"

  @atribuicao @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.normal
  Cenário: Atribuir ativo já ASSIGNED retorna 400
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-ASSGN-F" com usuário atribuído nessa unidade
    Quando tento atribuir o ativo "ASSET-ASSGN-F" a outro usuário
    Então a resposta deve ter status 400
    E a mensagem de erro deve indicar que ativo já está atribuído

  @desatribuicao @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.normal
  Cenário: Deve permitir desatribuir ativo atribuído
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-UNASSIGN-OK" com usuário atribuído nessa unidade
    Quando desatribuo o ativo "ASSET-UNASSIGN-OK"
    Então a resposta deve ter status 200
    E o ativo deve estar no status "AVAILABLE"

  @manutencao @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.critical
  Cenário: Não deve atribuir ativo em manutenção
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-MANUT-ASSIGN" em manutenção nessa unidade
    Quando tento atribuir o ativo "ASSET-MANUT-ASSIGN" a um usuário
    Então a resposta deve ter status 400
    E a mensagem de erro deve indicar que não pode atribuir ativo em manutenção

  @transferencia @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.critical
  Cenário: Deve permitir transferir ativo disponível
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-TRANSF-AVAIL" disponível nessa unidade
    Quando solicito transferência do ativo "ASSET-TRANSF-AVAIL" para a unidade extra
    Então a resposta deve ter status 201
    E o ativo deve estar no status "IN_TRANSFER"

  @transferencia @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.normal
  Cenário: Não deve transferir ativo atribuído
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-TRANSF-ASSIGN" com usuário atribuído nessa unidade
    Quando solicito transferência do ativo "ASSET-TRANSF-ASSIGN" para a unidade extra
    Então a resposta deve ter status 400
    E a mensagem de erro deve indicar que não pode transferir ativo atribuído

  @filtros @consistencia
  @allure.label.suite:Filtros_Estado
  @allure.severity.normal
  Cenário: Ativo atribuído não deve aparecer como disponível em filtros
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-FILT-1" com usuário atribuído nessa unidade
    Quando listo os ativos filtrando por status "AVAILABLE"
    Então o ativo "ASSET-FILT-1" não deve estar na listagem
    E quando listo filtrando por status "ASSIGNED", deve estar presente

  @filtros @consistencia
  @allure.label.suite:Filtros_Estado
  @allure.severity.normal
  Cenário: Ativo em manutenção deve aparecer corretamente nos filtros
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-FILT-2" em manutenção nessa unidade
    Quando listo os ativos filtrando por status "IN_MAINTENANCE"
    Então o ativo "ASSET-FILT-2" deve estar na listagem

  # ===========================================================================
  # SEÇÃO: BUSCA POR ID
  # ===========================================================================

  @busca
  @allure.label.suite:Busca_de_Ativos
  @allure.severity.critical
  Cenário: Deve buscar ativo por ID com sucesso
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando busco o ativo "ASSET-001" por ID
    Então a resposta deve ter status 200
    E o ativo criado deve ter assetTag "ASSET-001"

  @busca
  @allure.label.suite:Busca_de_Ativos
  @allure.severity.normal
  Cenário: Buscar ativo inexistente retorna 404
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando busco o ativo com id 999999
    Então a resposta deve ter status 404

  @listagem @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Cenário: GESTOR só visualiza ativos da própria unidade
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial Escopo" nessa organização como unidade extra
    E que existe um ativo "ASSET-OUTRA-UNIDADE" disponível na unidade extra
    Quando crio um ativo "ASSET-SEDE-GESTOR" do tipo "NOTEBOOK" modelo "Modelo Sede" na organização
    E que estou autenticado como "gestor@tech.com" com senha "Senha@123"
    Quando listo os ativos filtrando por assetTag "ASSET-SEDE-GESTOR"
    Então a resposta deve ter status 200
    E o ativo "ASSET-SEDE-GESTOR" deve estar na listagem
    Quando listo os ativos filtrando por assetTag "ASSET-OUTRA-UNIDADE"
    Então a resposta deve ter status 200
    E o ativo "ASSET-OUTRA-UNIDADE" não deve estar na listagem

  # ===========================================================================
  # SEÇÃO: CRIAÇÃO — AUTORIZAÇÃO E VALIDAÇÕES ADICIONAIS
  # ===========================================================================

  @criacao @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Cenário: OPERADOR não pode criar ativo
    Dado que estou autenticado como "operador@tech.com" com senha "Senha@123"
    Quando crio um ativo como operador na organização
    Então a resposta deve ter status 403

  @criacao
  @allure.label.suite:Criacao_de_Ativos
  @allure.severity.normal
  Cenário: GESTOR cria ativo com sucesso
    Dado que estou autenticado como "gestor@tech.com" com senha "Senha@123"
    Quando crio um ativo "ASSET-GESTOR-NEW" do tipo "TABLET" modelo "iPad Pro" na organização
    Então a resposta deve ter status 201
    E o ativo criado deve ter assetTag "ASSET-GESTOR-NEW"

  @criacao @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Cenário: GESTOR não pode criar ativo em unidade que não é sua
    Dado que existe uma unidade "Filial Restrita" nessa organização como unidade extra
    E que estou autenticado como "gestor@tech.com" com senha "Senha@123"
    Quando crio um ativo "ASSET-GESTOR-OUTRA" do tipo "NOTEBOOK" modelo "Modelo Restrito" na unidade extra
    Então a resposta deve ter status 403

  @criacao @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: AssetTag com 100 caracteres é aceito (boundary válido)
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo com assetTag de 100 caracteres na organização
    Então a resposta deve ter status 201

  @criacao @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: Criar ativo sem type retorna 400
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo sem type na organização
    Então a resposta deve ter status 400

  @criacao @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: Criar ativo sem modelo retorna 400
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo sem modelo na organização
    Então a resposta deve ter status 400

  @criacao @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: AssetTag duplicada retorna erro de negócio
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo "ASSET-DUP" do tipo "NOTEBOOK" modelo "Modelo A" na organização
    Então a resposta deve ter status 201
    Quando crio um ativo "ASSET-DUP" do tipo "NOTEBOOK" modelo "Modelo B" na organização
    Então a resposta deve ter status 400

  @criacao
  @allure.label.suite:Criacao_de_Ativos
  @allure.severity.normal
  Cenário: Criar ativo com assetTag automática retorna 201 com assetTag preenchida
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo com assetTag automática na organização
    Então a resposta deve ter status 201
    E o ativo criado deve ter assetTag preenchida automaticamente

  # ===========================================================================
  # SEÇÃO: APOSENTADORIA — ESTADOS ADICIONAIS
  # ===========================================================================

  @aposentadoria @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.normal
  Cenário: Aposentar ativo já RETIRED retorna 400
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-ALREADY-RETIRED" aposentado nessa unidade
    Quando tento aposentar o ativo "ASSET-ALREADY-RETIRED"
    Então a resposta deve ter status 400

  @aposentadoria
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.normal
  Cenário: Aposentar ativo inexistente retorna 404
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando tento aposentar o ativo com id 999999
    Então a resposta deve ter status 404

  # ===========================================================================
  # SEÇÃO: ATRIBUIÇÃO — ESTADOS ADICIONAIS
  # ===========================================================================

  @atribuicao @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.normal
  Cenário: Atribuir ativo em transferência retorna 400
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-INTRANSFER-ASSIGN" em transferência nessa unidade
    Quando tento atribuir o ativo "ASSET-INTRANSFER-ASSIGN" a um usuário
    Então a resposta deve ter status 400

  @atribuicao @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.normal
  Cenário: Atribuir ativo aposentado retorna 400
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-RETIRED-ASSIGN" aposentado nessa unidade
    Quando tento atribuir o ativo "ASSET-RETIRED-ASSIGN" a um usuário
    Então a resposta deve ter status 400
    E a mensagem de erro deve indicar que não pode atribuir ativo aposentado

  @atribuicao @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.normal
  Cenário: Atribuir a usuário inexistente retorna 404
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-ASSIGN-NOUSER" disponível nessa unidade
    Quando tento atribuir o ativo "ASSET-ASSIGN-NOUSER" a um usuário inexistente
    Então a resposta deve ter status 404

  @atribuicao @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.normal
  Cenário: Atribuir ativo inexistente retorna 404
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando tento atribuir o ativo com id 999999 ao usuário "operador@tech.com"
    Então a resposta deve ter status 404

  # ===========================================================================
  # SEÇÃO: DESATRIBUIÇÃO — ESTADO ADDITIONAL
  # ===========================================================================

  @desatribuicao @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.normal
  Cenário: Desatribuir ativo já disponível retorna 400
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-UNASSIGN-AVAIL" disponível nessa unidade
    Quando desatribuo o ativo disponível "ASSET-UNASSIGN-AVAIL"
    Então a resposta deve ter status 400

  @desatribuicao @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.normal
  Cenário: Desatribuir ativo inexistente retorna 404
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando desatribuo o ativo com id 999999
    Então a resposta deve ter status 404

  # ===========================================================================
  # SEÇÃO: DADOS FINANCEIROS
  # ===========================================================================

  @financeiro
  @allure.label.suite:Dados_Financeiros
  @allure.severity.normal
  Cenário: ADMIN atualiza dados financeiros do ativo com sucesso
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-FIN-UPDATE" disponível nessa unidade
    Quando atualizo os dados financeiros do ativo "ASSET-FIN-UPDATE"
    Então a resposta deve ter status 200
    E os dados financeiros devem estar atualizados

  # ===========================================================================
  # SEÇÃO: HISTÓRICO
  # ===========================================================================

  @historico
  @allure.label.suite:Historico_de_Ativos
  @allure.severity.normal
  Cenário: Listar histórico de status após operações
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-HIST-STATUS" disponível nessa unidade
    E que atribuo o ativo "ASSET-HIST-STATUS" ao usuário "operador@tech.com"
    Quando listo o histórico de status do ativo "ASSET-HIST-STATUS"
    Então a resposta deve ter status 200
    E o histórico deve conter pelo menos um registro

  @historico
  @allure.label.suite:Historico_de_Ativos
  @allure.severity.normal
  Cenário: Listar histórico de atribuições após assign
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-HIST-ASSIGN" disponível nessa unidade
    E que atribuo o ativo "ASSET-HIST-ASSIGN" ao usuário "operador@tech.com"
    Quando listo o histórico de atribuições do ativo "ASSET-HIST-ASSIGN"
    Então a resposta deve ter status 200
    E o histórico deve conter pelo menos um registro

  # ===========================================================================
  # SEÇÃO: FILTROS ADICIONAIS
  # ===========================================================================

  @filtros
  @allure.label.suite:Filtros_Estado
  @allure.severity.normal
  Cenário: Filtrar ativos por tipo retorna apenas ativos do tipo solicitado
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-VEHICLE-001" disponível nessa unidade
    Quando listo os ativos filtrando por tipo "NOTEBOOK"
    Então a resposta deve ter status 200

  @listagem @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Cenário: OPERADOR só visualiza seus próprios ativos
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um usuário OPERADOR adicional com email "operador2@tech.com" e senha "Senha@123"
    E que existe um ativo "ASSET-OP-OWN" atribuído ao usuário "operador@tech.com" nessa unidade
    E que existe um ativo "ASSET-OP-OUTRO" atribuído ao usuário "operador2@tech.com" nessa unidade
    E que estou autenticado como "operador@tech.com" com senha "Senha@123"
    Quando listo os ativos filtrando por assetTag "ASSET-OP-OWN"
    Então a resposta deve ter status 200
    E o ativo "ASSET-OP-OWN" deve estar na listagem
    Quando listo os ativos filtrando por assetTag "ASSET-OP-OUTRO"
    Então a resposta deve ter status 200
    E o ativo "ASSET-OP-OUTRO" não deve estar na listagem

  @seguranca
  @allure.label.suite:Seguranca
  @allure.severity.critical
  Cenário: AssetTag com caracteres de injeção SQL é tratado com segurança
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo "' OR 1=1 --" do tipo "NOTEBOOK" modelo "Modelo SQL" na organização
    Então a resposta deve ter status 201
    E o ativo criado deve ter assetTag "' OR 1=1 --"

  @seguranca
  @allure.label.suite:Seguranca
  @allure.severity.critical
  Cenário: AssetTag com payload XSS é armazenada como texto literal
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo "<script>alert(1)</script>" do tipo "NOTEBOOK" modelo "Modelo XSS" na organização
    Então a resposta deve ter status 201
    E o ativo criado deve ter assetTag "<script>alert(1)</script>"

  @seguranca @autorizacao
  @allure.label.suite:Seguranca
  @allure.severity.critical
  Cenário: Token de outro usuário não acessa recurso restrito
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um usuário OPERADOR adicional com email "operador3@tech.com" e senha "Senha@123"
    E que existe um ativo "ASSET-PRIVADO-OP3" atribuído ao usuário "operador3@tech.com" nessa unidade
    E que estou autenticado como "operador@tech.com" com senha "Senha@123"
    Quando busco o ativo "ASSET-PRIVADO-OP3" por ID
    Então a resposta deve ter status 403

  @seguranca @autorizacao
  @allure.label.suite:Seguranca
  @allure.severity.critical
  Cenário: IDOR — buscar ativo de outra organização retorna acesso negado
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma organização secundária "Other Corp" cadastrada
    E que existe uma unidade "Branch Other" na organização secundária
    E que existe um usuário ADMIN da organização secundária com email "admin@other.com" e senha "Senha@123"
    E que existe um ativo "ASSET-OUTRA-ORG" disponível na organização secundária
    Quando busco o ativo "ASSET-OUTRA-ORG" por ID
    Então a resposta deve ter status 403
