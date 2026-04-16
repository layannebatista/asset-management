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
