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

  @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: Deve retornar 400 quando validação falhar
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo com dados inválidos na organização
    Então a resposta deve ter status 400

  @autenticacao
  @allure.label.suite:Autenticacao
  @allure.severity.blocker
  Cenário: Deve retornar 401 sem autenticação
    Quando listo os ativos sem autenticação
    Então a resposta deve ter status 401

  @autenticacao
  @allure.label.suite:Autenticacao
  @allure.severity.blocker
  Cenário: Sem autenticação deve retornar 401
    Quando busco um ativo por id sem autenticação
    Então a resposta deve ter status 401

  @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Cenário: GESTOR não pode aposentar
    Dado que estou autenticado como "gestor@tech.com" com senha "Senha@123"
    Quando tento aposentar o ativo "ASSET-001"
    Então a resposta deve ter status 403

  @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Cenário: OPERADOR não deve criar asset
    Dado que estou autenticado como "operador@tech.com" com senha "Senha@123"
    Quando crio um ativo como operador na organização
    Então a resposta deve ter status 403

  @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Cenário: User não pode aposentar ativo
    Dado que estou autenticado como "operador@tech.com" com senha "Senha@123"
    Quando tento aposentar o ativo "ASSET-001"
    Então a resposta deve ter status 403

  @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Cenário: User não pode atribuir ativo
    Dado que estou autenticado como "operador@tech.com" com senha "Senha@123"
    Quando tento atribuir o ativo "ASSET-001" a outro usuário
    Então a resposta deve ter status 403

  @erro
  @allure.label.suite:Contratos_de_Erro
  @allure.severity.normal
  Cenário: Deve retornar 404 se ativo não existir
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando busco o ativo com id 99999
    Então a resposta deve ter status 404

  @criacao
  @allure.label.suite:Criacao_de_Ativos
  @allure.severity.critical
  Cenário: ADMIN cria ativo com sucesso
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo "ASSET-NOVO" do tipo "NOTEBOOK" modelo "Dell XPS 15" na organização
    Então a resposta deve ter status 201

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

  @listagem @filtro
  @allure.label.suite:Listagem_de_Ativos
  @allure.severity.normal
  Cenário: Filtrar ativos por status ASSIGNED retorna apenas atribuídos
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um usuário OPERADOR com email "operador@tech.com" e senha "Senha@123"
    E que existe um ativo "ASSET-ASSIGNED" atribuído nessa unidade
    Quando listo os ativos filtrando por status "ASSIGNED"
    Então a resposta deve ter status 200

  @listagem @filtro
  @allure.label.suite:Listagem_de_Ativos
  @allure.severity.normal
  Cenário: Filtrar ativos por status IN_MAINTENANCE retorna apenas em manutenção
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-MANUT-F" em manutenção nessa unidade
    Quando listo os ativos filtrando por status "IN_MAINTENANCE"
    Então a resposta deve ter status 200

  @listagem @filtro
  @allure.label.suite:Listagem_de_Ativos
  @allure.severity.normal
  Cenário: Filtrar ativos por assetTag retorna resultado correspondente
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando listo os ativos filtrando por assetTag "ASSET-001"
    Então a resposta deve ter status 200
    E a listagem deve conter ativos com assetTag preenchido

  @criacao @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: POST sem assetTag retorna 400
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo sem assetTag na organização
    Então a resposta deve ter status 400

  @criacao @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: POST sem type retorna 400
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo sem type na organização
    Então a resposta deve ter status 400

  @criacao @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Cenário: GESTOR não pode criar ativo em outra unidade
    E que existe uma unidade "Filial" nessa organização como unidade extra
    Dado que estou autenticado como "gestor@tech.com" com senha "Senha@123"
    Quando crio um ativo "ASSET-GESTOR-X" do tipo "NOTEBOOK" modelo "Dell XPS" na unidade extra
    Então a resposta deve ter status 403

  @aposentadoria @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.critical
  Cenário: Aposentar ativo já RETIRED retorna 400
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-RET-F" aposentado nessa unidade
    Quando tento aposentar o ativo "ASSET-RET-F"
    Então a resposta deve ter status 400

  @criacao @validacao @boundary
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: AssetTag com exatamente 100 caracteres é aceito
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    Quando crio um ativo com assetTag de 100 caracteres na organização
    Então a resposta deve ter status 201

  @criacao @validacao @boundary
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
  @allure.severity.normal
  Cenário: Atribuir ativo já ASSIGNED retorna 400
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-ASSGN-F" com usuário atribuído nessa unidade
    Quando tento atribuir o ativo "ASSET-ASSGN-F" a outro usuário
    Então a resposta deve ter status 400

  @atribuicao @regra-negocio
  @allure.label.suite:Operacoes_de_Estado
  @allure.severity.normal
  Cenário: Atribuir ativo RETIRED retorna 400
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-RET-A" aposentado nessa unidade
    Quando tento atribuir o ativo "ASSET-RET-A" a outro usuário
    Então a resposta deve ter status 400

  ############################################################
  # 🔄 MATRIZ DE ESTADOS — ASSIGN
  ############################################################

  @atribuicao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_ASSIGN
  @allure.severity.critical
  Cenário: Não deve atribuir ativo em manutenção
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-MANUT-ASSIGN" em manutenção nessa unidade
    Quando tento atribuir o ativo "ASSET-MANUT-ASSIGN" a um usuário
    Então a resposta deve ter status 400
    E a mensagem de erro deve indicar que não pode atribuir ativo em manutenção

  @atribuicao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_ASSIGN
  @allure.severity.critical
  Cenário: Não deve atribuir ativo em transferência
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-TRANSF-ASSIGN" em transferência nessa unidade
    Quando tento atribuir o ativo "ASSET-TRANSF-ASSIGN" a um usuário
    Então a resposta deve ter status 400
    E a mensagem de erro deve indicar que não pode atribuir ativo em transferência

  @atribuicao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_ASSIGN
  @allure.severity.critical
  Cenário: Não deve atribuir ativo já atribuído
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-DUP-ASSIGN" com usuário atribuído nessa unidade
    Quando tento atribuir o ativo "ASSET-DUP-ASSIGN" a outro usuário
    Então a resposta deve ter status 400
    E a mensagem de erro deve indicar que ativo já está atribuído

  @atribuicao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_ASSIGN
  @allure.severity.critical
  Cenário: Não deve atribuir ativo aposentado
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-RET-ASSIGN" aposentado nessa unidade
    Quando tento atribuir o ativo "ASSET-RET-ASSIGN" a um usuário
    Então a resposta deve ter status 400
    E a mensagem de erro deve indicar que não pode atribuir ativo aposentado

  @atribuicao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_ASSIGN
  @allure.severity.critical
  Cenário: Deve permitir atribuir ativo disponível
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-AVAIL-ASSIGN" disponível nessa unidade
    Quando atribuo o ativo "ASSET-AVAIL-ASSIGN" ao usuário "operador@tech.com"
    Então a resposta deve ter status 200
    E o ativo deve estar no status "ASSIGNED"

  ############################################################
  # 🔄 MATRIZ DE ESTADOS — UNASSIGN
  ############################################################

  @desatribuicao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_UNASSIGN
  @allure.severity.critical
  Cenário: Deve permitir desatribuir ativo atribuído
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-UNASSIGN-OK" com usuário atribuído nessa unidade
    Quando desatribuo o ativo "ASSET-UNASSIGN-OK"
    Então a resposta deve ter status 200
    E o ativo deve estar no status "AVAILABLE"

  @desatribuicao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_UNASSIGN
  @allure.severity.critical
  Cenário: Não deve desatribuir ativo disponível
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-UNASSIGN-AVAIL" disponível nessa unidade
    Quando desatribuo o ativo "ASSET-UNASSIGN-AVAIL"
    Então a resposta deve ter status 400
    E a mensagem de erro deve indicar que ativo já está disponível

  @desatribuicao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_UNASSIGN
  @allure.severity.critical
  Cenário: Não deve desatribuir ativo em manutenção
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-UNASSIGN-MANUT" em manutenção nessa unidade
    Quando desatribuo o ativo "ASSET-UNASSIGN-MANUT"
    Então a resposta deve ter status 400

  @desatribuicao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_UNASSIGN
  @allure.severity.critical
  Cenário: Não deve desatribuir ativo em transferência
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-UNASSIGN-TRANSF" em transferência nessa unidade
    Quando desatribuo o ativo "ASSET-UNASSIGN-TRANSF"
    Então a resposta deve ter status 400

  @desatribuicao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_UNASSIGN
  @allure.severity.critical
  Cenário: Não deve desatribuir ativo aposentado
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-UNASSIGN-RET" aposentado nessa unidade
    Quando desatribuo o ativo "ASSET-UNASSIGN-RET"
    Então a resposta deve ter status 400

  ############################################################
  # 🔄 MATRIZ DE ESTADOS — RETIRE
  ############################################################

  @aposentadoria @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_RETIRE
  @allure.severity.critical
  Cenário: Deve permitir aposentar ativo disponível
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-RETIRE-AVAIL" disponível nessa unidade
    Quando aposentan o ativo "ASSET-RETIRE-AVAIL"
    Então a resposta deve ter status 200
    E o ativo deve estar no status "RETIRED"

  @aposentadoria @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_RETIRE
  @allure.severity.critical
  Cenário: Deve permitir aposentar ativo atribuído
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-RETIRE-ASSIGN" com usuário atribuído nessa unidade
    Quando aposentan o ativo "ASSET-RETIRE-ASSIGN"
    Então a resposta deve ter status 200
    E o ativo deve estar no status "RETIRED"

  @aposentadoria @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_RETIRE
  @allure.severity.critical
  Cenário: Não deve aposentar ativo em manutenção
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-RETIRE-MANUT" em manutenção nessa unidade
    Quando aposentan o ativo "ASSET-RETIRE-MANUT"
    Então a resposta deve ter status 400
    E a mensagem de erro deve indicar que não pode aposentar ativo em manutenção

  @aposentadoria @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_RETIRE
  @allure.severity.critical
  Cenário: Não deve aposentar ativo em transferência
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-RETIRE-TRANSF" em transferência nessa unidade
    Quando aposentan o ativo "ASSET-RETIRE-TRANSF"
    Então a resposta deve ter status 400

  @aposentadoria @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_RETIRE
  @allure.severity.critical
  Cenário: Não deve aposentar ativo já aposentado
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-RETIRE-DUP" aposentado nessa unidade
    Quando aposentan o ativo "ASSET-RETIRE-DUP"
    Então a resposta deve ter status 400

  ############################################################
  # 🔄 MATRIZ DE ESTADOS — MANUTENÇÃO
  ############################################################

  @manutencao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_MANUTENCAO
  @allure.severity.critical
  Cenário: Deve permitir iniciar manutenção de ativo disponível
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-MAINT-AVAIL" disponível nessa unidade
    Quando solicito manutenção para o ativo "ASSET-MAINT-AVAIL"
    Então a resposta deve ter status 201
    E o ativo deve estar no status "IN_MAINTENANCE"

  @manutencao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_MANUTENCAO
  @allure.severity.critical
  Cenário: Deve permitir iniciar manutenção de ativo atribuído
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-MAINT-ASSIGN" com usuário atribuído nessa unidade
    Quando solicito manutenção para o ativo "ASSET-MAINT-ASSIGN"
    Então a resposta deve ter status 201
    E o ativo deve estar no status "IN_MAINTENANCE"

  @manutencao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_MANUTENCAO
  @allure.severity.critical
  Cenário: Não deve iniciar manutenção de ativo em transferência
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-MAINT-TRANSF" em transferência nessa unidade
    Quando solicito manutenção para o ativo "ASSET-MAINT-TRANSF"
    Então a resposta deve ter status 400
    E a mensagem de erro deve indicar que ativo está em transferência

  @manutencao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_MANUTENCAO
  @allure.severity.critical
  Cenário: Não deve iniciar manutenção de ativo já em manutenção
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-MAINT-DUP" em manutenção nessa unidade
    Quando solicito manutenção para o ativo "ASSET-MAINT-DUP"
    Então a resposta deve ter status 400
    E a mensagem de erro deve indicar que ativo já está em manutenção

  @manutencao @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_MANUTENCAO
  @allure.severity.critical
  Cenário: Não deve iniciar manutenção de ativo aposentado
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-MAINT-RET" aposentado nessa unidade
    Quando solicito manutenção para o ativo "ASSET-MAINT-RET"
    Então a resposta deve ter status 400

  ############################################################
  # 🔄 MATRIZ DE ESTADOS — TRANSFERÊNCIA
  ############################################################

  @transferencia @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_TRANSFERENCIA
  @allure.severity.critical
  Cenário: Deve permitir transferir ativo disponível
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-TRANSF-AVAIL" disponível nessa unidade
    Quando solicito transferência do ativo "ASSET-TRANSF-AVAIL" para a unidade extra
    Então a resposta deve ter status 201
    E o ativo deve estar no status "IN_TRANSFER"

  @transferencia @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_TRANSFERENCIA
  @allure.severity.critical
  Cenário: Não deve transferir ativo atribuído
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-TRANSF-ASSIGN" com usuário atribuído nessa unidade
    Quando solicito transferência do ativo "ASSET-TRANSF-ASSIGN" para a unidade extra
    Então a resposta deve ter status 400
    E a mensagem de erro deve indicar que não pode transferir ativo atribuído

  @transferencia @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_TRANSFERENCIA
  @allure.severity.critical
  Cenário: Não deve transferir ativo em manutenção
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-TRANSF-MANUT" em manutenção nessa unidade
    Quando solicito transferência do ativo "ASSET-TRANSF-MANUT" para a unidade extra
    Então a resposta deve ter status 400

  @transferencia @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_TRANSFERENCIA
  @allure.severity.critical
  Cenário: Não deve transferir ativo já em transferência
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-TRANSF-DUP" em transferência nessa unidade
    Quando solicito transferência do ativo "ASSET-TRANSF-DUP" para a unidade extra
    Então a resposta deve ter status 400

  @transferencia @matriz-estados @regra-negocio
  @allure.label.suite:Matriz_de_Estados_TRANSFERENCIA
  @allure.severity.critical
  Cenário: Não deve transferir ativo aposentado
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-TRANSF-RET" aposentado nessa unidade
    Quando solicito transferência do ativo "ASSET-TRANSF-RET" para a unidade extra
    Então a resposta deve ter status 400

  ############################################################
  # ⛓️ SEQUÊNCIA — WORKFLOWS INVÁLIDOS
  ############################################################

  @sequencia @workflow @regra-negocio
  @allure.label.suite:Sequencia_Workflows_Invalidos
  @allure.severity.critical
  Cenário: Não deve atribuir ativo após iniciar transferência
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-SEQ-1" disponível nessa unidade
    E que solicito transferência do ativo "ASSET-SEQ-1" para a unidade extra
    Quando tento atribuir o ativo "ASSET-SEQ-1" a um usuário
    Então a resposta deve ter status 400

  @sequencia @workflow @regra-negocio
  @allure.label.suite:Sequencia_Workflows_Invalidos
  @allure.severity.critical
  Cenário: Não deve atribuir ativo após solicitar manutenção
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-SEQ-2" disponível nessa unidade
    E que solicito manutenção para o ativo "ASSET-SEQ-2"
    Quando tento atribuir o ativo "ASSET-SEQ-2" a um usuário
    Então a resposta deve ter status 400

  @sequencia @workflow @regra-negocio
  @allure.label.suite:Sequencia_Workflows_Invalidos
  @allure.severity.critical
  Cenário: Não deve transferir ativo após iniciar manutenção
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-SEQ-3" disponível nessa unidade
    E que solicito manutenção para o ativo "ASSET-SEQ-3"
    Quando solicito transferência do ativo "ASSET-SEQ-3" para a unidade extra
    Então a resposta deve ter status 400

  @sequencia @workflow @regra-negocio
  @allure.label.suite:Sequencia_Workflows_Invalidos
  @allure.severity.critical
  Cenário: Não deve iniciar manutenção após iniciar transferência
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-SEQ-4" disponível nessa unidade
    E que solicito transferência do ativo "ASSET-SEQ-4" para a unidade extra
    Quando solicito manutenção para o ativo "ASSET-SEQ-4"
    Então a resposta deve ter status 400

  @sequencia @workflow @regra-negocio
  @allure.label.suite:Sequencia_Workflows_Invalidos
  @allure.severity.critical
  Cenário: Não deve aposentar ativo após iniciar transferência
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-SEQ-5" disponível nessa unidade
    E que solicito transferência do ativo "ASSET-SEQ-5" para a unidade extra
    Quando aposentan o ativo "ASSET-SEQ-5"
    Então a resposta deve ter status 400

  @sequencia @workflow @regra-negocio
  @allure.label.suite:Sequencia_Workflows_Invalidos
  @allure.severity.critical
  Cenário: Não deve aposentar ativo após iniciar manutenção
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-SEQ-6" disponível nessa unidade
    E que solicito manutenção para o ativo "ASSET-SEQ-6"
    Quando aposentan o ativo "ASSET-SEQ-6"
    Então a resposta deve ter status 400

  ############################################################
  # ⛓️ SEQUÊNCIA — REENTRÂNCIA / DUPLICIDADE
  ############################################################

  @sequencia @reentrancia @regra-negocio
  @allure.label.suite:Sequencia_Reentrancia
  @allure.severity.critical
  Cenário: Não deve permitir atribuição duplicada consecutiva
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-REENT-1" disponível nessa unidade
    E que atribuo o ativo "ASSET-REENT-1" ao usuário "operador@tech.com"
    Quando tento atribuir novamente o ativo "ASSET-REENT-1" ao mesmo usuário
    Então a resposta deve ter status 400

  @sequencia @reentrancia @regra-negocio
  @allure.label.suite:Sequencia_Reentrancia
  @allure.severity.critical
  Cenário: Não deve permitir solicitação de transferência duplicada
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-REENT-2" disponível nessa unidade
    E que solicito transferência do ativo "ASSET-REENT-2" para a unidade extra
    Quando solicito novamente transferência do ativo "ASSET-REENT-2" para a unidade extra
    Então a resposta deve ter status 400

  @sequencia @reentrancia @regra-negocio
  @allure.label.suite:Sequencia_Reentrancia
  @allure.severity.critical
  Cenário: Não deve permitir solicitação de manutenção duplicada
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-REENT-3" disponível nessa unidade
    E que solicito manutenção para o ativo "ASSET-REENT-3"
    Quando solicito novamente manutenção para o ativo "ASSET-REENT-3"
    Então a resposta deve ter status 400

  @sequencia @reentrancia @regra-negocio
  @allure.label.suite:Sequencia_Reentrancia
  @allure.severity.critical
  Cenário: Não deve permitir concluir operação já finalizada
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-REENT-4" disponível nessa unidade
    E que solicito manutenção para o ativo "ASSET-REENT-4"
    E que concluo a manutenção do ativo "ASSET-REENT-4"
    Quando tenta concluir novamente a manutenção do ativo "ASSET-REENT-4"
    Então a resposta deve ter status 400

  @sequencia @reentrancia @regra-negocio
  @allure.label.suite:Sequencia_Reentrancia
  @allure.severity.critical
  Cenário: Não deve permitir repetir operação após estado final
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-REENT-5" disponível nessa unidade
    E que aposentan o ativo "ASSET-REENT-5"
    Quando tento aposentan novamente o ativo "ASSET-REENT-5"
    Então a resposta deve ter status 400

  ############################################################
  # 🔗 INTERAÇÃO ENTRE MÓDULOS
  ############################################################

  @integracao @modulos @regra-negocio
  @allure.label.suite:Integracao_Modulos
  @allure.severity.critical
  Cenário: Ativo em manutenção não deve ser transferido
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-INTEG-1" em manutenção nessa unidade
    Quando solicito transferência do ativo "ASSET-INTEG-1" para a unidade extra
    Então a resposta deve ter status 400

  @integracao @modulos @regra-negocio
  @allure.label.suite:Integracao_Modulos
  @allure.severity.critical
  Cenário: Ativo em transferência não deve entrar em manutenção
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-INTEG-2" em transferência nessa unidade
    Quando solicito manutenção para o ativo "ASSET-INTEG-2"
    Então a resposta deve ter status 400

  @integracao @modulos @regra-negocio
  @allure.label.suite:Integracao_Modulos
  @allure.severity.critical
  Cenário: Ativo atribuído não deve ser transferido
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-INTEG-3" com usuário atribuído nessa unidade
    Quando solicito transferência do ativo "ASSET-INTEG-3" para a unidade extra
    Então a resposta deve ter status 400

  @integracao @modulos @regra-negocio
  @allure.label.suite:Integracao_Modulos
  @allure.severity.critical
  Cenário: Ativo transferido não deve ser atribuído antes de conclusão
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-INTEG-4" em transferência nessa unidade
    Quando tento atribuir o ativo "ASSET-INTEG-4" a um usuário
    Então a resposta deve ter status 400

  @integracao @modulos @regra-negocio
  @allure.label.suite:Integracao_Modulos
  @allure.severity.critical
  Cenário: Ativo em manutenção não deve ser aposentado
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-INTEG-5" em manutenção nessa unidade
    Quando aposentan o ativo "ASSET-INTEG-5"
    Então a resposta deve ter status 400

  @integracao @modulos @regra-negocio
  @allure.label.suite:Integracao_Modulos
  @allure.severity.critical
  Cenário: Ativo transferido não deve ser aposentado
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-INTEG-6" em transferência nessa unidade
    Quando aposentan o ativo "ASSET-INTEG-6"
    Então a resposta deve ter status 400

  ############################################################
  # 🔐 AUTORIZAÇÃO + CONTEXTO (MULTI-TENANT)
  ############################################################

  @autorizacao @multitenant @regra-negocio
  @allure.label.suite:Autorizacao_MultiTenant
  @allure.severity.critical
  Cenário: GESTOR não deve atribuir ativo de outra unidade
    Dado que estou autenticado como "gestor@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-MT-1" disponível na unidade extra
    Quando tento atribuir o ativo "ASSET-MT-1" a um usuário
    Então a resposta deve ter status 403

  @autorizacao @multitenant @regra-negocio
  @allure.label.suite:Autorizacao_MultiTenant
  @allure.severity.critical
  Cenário: GESTOR não deve transferir ativo de outra unidade
    Dado que estou autenticado como "gestor@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-MT-2" disponível na unidade extra
    E que existe uma unidade "Outra Filial" nessa organização como unidade extra 2
    Quando solicito transferência do ativo "ASSET-MT-2" para a unidade extra 2
    Então a resposta deve ter status 403

  @autorizacao @multitenant @regra-negocio
  @allure.label.suite:Autorizacao_MultiTenant
  @allure.severity.critical
  Cenário: GESTOR não deve iniciar manutenção de ativo de outra unidade
    Dado que estou autenticado como "gestor@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-MT-3" disponível na unidade extra
    Quando solicito manutenção para o ativo "ASSET-MT-3"
    Então a resposta deve ter status 403

  @autorizacao @multitenant @regra-negocio
  @allure.label.suite:Autorizacao_MultiTenant
  @allure.severity.critical
  Cenário: OPERADOR não deve atribuir ativo mesmo estando disponível
    Dado que estou autenticado como "operador@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-MT-4" disponível nessa unidade
    Quando tento atribuir o ativo "ASSET-MT-4" a outro usuário
    Então a resposta deve ter status 403

  @autorizacao @multitenant @regra-negocio
  @allure.label.suite:Autorizacao_MultiTenant
  @allure.severity.critical
  Cenário: OPERADOR não deve transferir ativo
    Dado que estou autenticado como "operador@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-MT-5" disponível nessa unidade
    Quando solicito transferência do ativo "ASSET-MT-5" para a unidade extra
    Então a resposta deve ter status 403

  @autorizacao @multitenant @regra-negocio
  @allure.label.suite:Autorizacao_MultiTenant
  @allure.severity.critical
  Cenário: OPERADOR não deve iniciar manutenção
    Dado que estou autenticado como "operador@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-MT-6" disponível nessa unidade
    Quando solicito manutenção para o ativo "ASSET-MT-6"
    Então a resposta deve ter status 403

  ############################################################
  # 🔐 AUTORIZAÇÃO + ESTADO
  ############################################################

  @autorizacao @estado @regra-negocio
  @allure.label.suite:Autorizacao_Estado
  @allure.severity.critical
  Cenário: GESTOR não deve aposentar ativo mesmo em estado válido
    Dado que estou autenticado como "gestor@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-AUTH-1" disponível nessa unidade
    Quando tempo aposentan o ativo "ASSET-AUTH-1"
    Então a resposta deve ter status 403

  @autorizacao @estado @regra-negocio
  @allure.label.suite:Autorizacao_Estado
  @allure.severity.critical
  Cenário: OPERADOR não deve aposentar ativo em nenhum estado
    Dado que estou autenticado como "operador@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-AUTH-2" disponível nessa unidade
    Quando tempo aposentan o ativo "ASSET-AUTH-2"
    Então a resposta deve ter status 403

  @autorizacao @estado @regra-negocio
  @allure.label.suite:Autorizacao_Estado
  @allure.severity.critical
  Cenário: ADMIN deve conseguir executar todas as ações em estados válidos
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-AUTH-3" disponível nessa unidade
    E que existe um usuário OPERADOR com email "novo-operador@tech.com" e senha "Senha@123"
    Quando atribuo o ativo "ASSET-AUTH-3" ao usuário "novo-operador@tech.com"
    E desatribuo o ativo "ASSET-AUTH-3"
    E solicito manutenção para o ativo "ASSET-AUTH-3"
    E aposentan o ativo "ASSET-AUTH-3"
    Então todas as operações devem ter sucesso

  ############################################################
  # 🧱 INVARIANTES DE NEGÓCIO
  ############################################################

  @invariantes @consistencia @regra-negocio
  @allure.label.suite:Invariantes_Negocio
  @allure.severity.critical
  Cenário: Ativo não deve estar simultaneamente atribuído e em manutenção
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-INV-1" com usuário atribuído nessa unidade
    Quando solicito manutenção para o ativo "ASSET-INV-1"
    E concluo a manutenção do ativo "ASSET-INV-1"
    Então o ativo não deve estar simultaneamente atribuído e em manutenção

  @invariantes @consistencia @regra-negocio
  @allure.label.suite:Invariantes_Negocio
  @allure.severity.critical
  Cenário: Ativo não deve estar simultaneamente em transferência e disponível
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe uma unidade "Filial" nessa organização como unidade extra
    E que existe um ativo "ASSET-INV-2" em transferência nessa unidade
    Quando obtenho o status do ativo "ASSET-INV-2"
    Então o ativo não deve estar com status simultâneos de TRANSFERENCIA e AVAILABLE

  @invariantes @consistencia @regra-negocio
  @allure.label.suite:Invariantes_Negocio
  @allure.severity.critical
  Cenário: Ativo não deve permitir múltiplas operações concorrentes
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-INV-3" disponível nessa unidade
    Quando envio múltiplas requisições de atribuição em paralelo para o ativo "ASSET-INV-3"
    Então apenas uma operação deve ter sucesso e as demais devem falhar

  @invariantes @consistencia @regra-negocio
  @allure.label.suite:Invariantes_Negocio
  @allure.severity.critical
  Cenário: Ativo deve manter consistência de estado após falha de operação
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-INV-4" disponível nessa unidade
    Quando tenta uma operação inválida que falhará
    E obtenho o status do ativo "ASSET-INV-4"
    Então o estado do ativo deve permanecer consistente com o estado anterior

  ############################################################
  # ⚠️ CONSISTÊNCIA E RECUPERAÇÃO
  ############################################################

  @consistencia @recuperacao @regra-negocio
  @allure.label.suite:Consistencia_Recuperacao
  @allure.severity.critical
  Cenário: Falha ao atribuir não deve alterar estado do ativo
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-CONS-1" disponível nessa unidade
    E o estado inicial do ativo é "AVAILABLE"
    Quando tenta atribuir o ativo a um usuário inexistente
    Então o ativo deve permanecer no estado "AVAILABLE"

  @consistencia @recuperacao @regra-negocio
  @allure.label.suite:Consistencia_Recuperacao
  @allure.severity.critical
  Cenário: Falha ao transferir não deve alterar estado do ativo
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-CONS-2" disponível nessa unidade
    E o estado inicial do ativo é "AVAILABLE"
    Quando tenta transferir o ativo para uma unidade inexistente
    Então o ativo deve permanecer no estado "AVAILABLE"

  @consistencia @recuperacao @regra-negocio
  @allure.label.suite:Consistencia_Recuperacao
  @allure.severity.critical
  Cenário: Falha ao iniciar manutenção não deve alterar estado do ativo
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-CONS-3" disponível nessa unidade
    E o estado inicial do ativo é "AVAILABLE"
    Quando tenta solicitar manutenção com dados inválidos
    Então o ativo deve permanecer no estado "AVAILABLE"

  @consistencia @recuperacao @regra-negocio
  @allure.label.suite:Consistencia_Recuperacao
  @allure.severity.critical
  Cenário: Operação parcial não deve deixar ativo em estado inconsistente
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-CONS-4" disponível nessa unidade
    Quando uma operação complexa é interrompida no meio
    Então o ativo deve estar em um estado consistente e válido

  ############################################################
  # 🔄 CONCORRÊNCIA (AVANÇADO)
  ############################################################

  @concorrencia @regra-negocio
  @allure.label.suite:Concorrencia_Avancada
  @allure.severity.critical
  Cenário: Não deve permitir atribuição simultânea do mesmo ativo
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existem múltiplos usuários criados
    E que existe um ativo "ASSET-CONC-1" disponível nessa unidade
    Quando envio múltiplas requisições de atribuição simultâneas
    Então apenas uma atribuição deve ter sucesso
    E o ativo deve estar atribuído a apenas um usuário

  @concorrencia @regra-negocio
  @allure.label.suite:Concorrencia_Avancada
  @allure.severity.critical
  Cenário: Não deve permitir transferência simultânea do mesmo ativo
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existem múltiplas unidades criadas
    E que existe um ativo "ASSET-CONC-2" disponível nessa unidade
    Quando envio múltiplas requisições de transferência simultâneas
    Então apenas uma transferência deve ter sucesso
    E o ativo deve estar em apenas uma transferência

  @concorrencia @regra-negocio
  @allure.label.suite:Concorrencia_Avancada
  @allure.severity.critical
  Cenário: Não deve permitir manutenção simultânea do mesmo ativo
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-CONC-3" disponível nessa unidade
    Quando envio múltiplas requisições de manutenção simultâneas
    Então apenas uma manutenção deve ter sucesso
    E o ativo deve estar em apenas uma operação de manutenção

  ############################################################
  # 🧪 EDGE CASES DE ESTADO
  ############################################################

  @edge-cases @regra-negocio
  @allure.label.suite:Edge_Cases_Estado
  @allure.severity.critical
  Cenário: Deve manter consistência ao alternar rapidamente estados
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-EDGE-1" disponível nessa unidade
    Quando executo rápidas transições de estado para o ativo
    Então o ativo deve manter um estado consistente ao final

  @edge-cases @regra-negocio
  @allure.label.suite:Edge_Cases_Estado
  @allure.severity.critical
  Cenário: Não deve permitir transições inválidas em sequência rápida
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-EDGE-2" disponível nessa unidade
    Quando tenta executar transições inválidas em sequência rápida
    Então todas as transições inválidas devem ser rejeitadas

  @edge-cases @regra-negocio
  @allure.label.suite:Edge_Cases_Estado
  @allure.severity.critical
  Cenário: Deve rejeitar operações baseadas em estado desatualizado
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-EDGE-3" disponível nessa unidade
    Quando faz uma operação baseada em versão anterior do estado
    Então a operação deve ser rejeitada com erro de conflito

  ############################################################
  # 🔍 FILTROS BASEADOS EM ESTADO (CONSISTÊNCIA)
  ############################################################

  @filtros @consistencia @regra-negocio
  @allure.label.suite:Filtros_Estado
  @allure.severity.normal
  Cenário: Ativo atribuído não deve aparecer como disponível em filtros
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-FILT-1" com usuário atribuído nessa unidade
    Quando listo os ativos filtrando por status "AVAILABLE"
    Então o ativo "ASSET-FILT-1" não deve estar na listagem
    E quando listo filtrando por status "ASSIGNED", deve estar presente

  @filtros @consistencia @regra-negocio
  @allure.label.suite:Filtros_Estado
  @allure.severity.normal
  Cenário: Ativo em manutenção deve aparecer corretamente nos filtros
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-FILT-2" em manutenção nessa unidade
    Quando listo os ativos filtrando por status "IN_MAINTENANCE"
    Então o ativo "ASSET-FILT-2" deve estar na listagem

  @filtros @consistencia @regra-negocio
  @allure.label.suite:Filtros_Estado
  @allure.severity.normal
  Cenário: Ativo em transferência deve aparecer corretamente nos filtros
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-FILT-3" em transferência nessa unidade
    Quando listo os ativos filtrando por status "IN_TRANSFER"
    Então o ativo "ASSET-FILT-3" deve estar na listagem

  @filtros @consistencia @regra-negocio
  @allure.label.suite:Filtros_Estado
  @allure.severity.normal
  Cenário: Ativo aposentado não deve aparecer como ativo disponível
    Dado que estou autenticado como "admin@tech.com" com senha "Senha@123"
    E que existe um ativo "ASSET-FILT-4" aposentado nessa unidade
    Quando listo os ativos filtrando por status "AVAILABLE"
    Então o ativo "ASSET-FILT-4" não deve estar na listagem
    E quando listo filtrando por status "RETIRED", deve estar presente
