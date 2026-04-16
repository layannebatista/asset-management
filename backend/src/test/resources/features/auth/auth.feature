# language: pt
# Projeto: Patrimônio 360
# Domínio: Autenticação
# Executar com: mvn test -Dtest=CucumberRunnerTest

@auth
@allure.label.parentSuite:Backend
@allure.label.epic:Gestao_de_Autenticacao
Funcionalidade: Autenticação e Sessão
  Como usuário do sistema
  Quero autenticar, renovar a sessão e encerrar o acesso com segurança
  Para consumir os endpoints protegidos corretamente

  Contexto:
    Dado que existe uma organização "Secure Corp" cadastrada
    E que existe uma unidade "Matriz" nessa organização
    E que existe um usuário ADMIN com email "admin@secure.com" e senha "Senha@123"
    E que existe um usuário GESTOR com email "gestor@secure.com" e senha "Senha@123"
    E que existe um usuário OPERADOR com email "operador@secure.com" e senha "Senha@123"

  @login
  @allure.label.suite:Login
  @allure.severity.critical
  Cenário: Login com credenciais válidas retorna tokens
    Quando realizo login com email "admin@secure.com" e senha "Senha@123"
    Então a resposta deve ter status 200
    E a resposta de autenticação deve conter accessToken e refreshToken

  @login
  @allure.label.suite:Login
  @allure.severity.normal
  Cenário: Login com senha inválida retorna 401
    Quando realizo login com email "admin@secure.com" e senha "SenhaErrada!"
    Então a resposta deve ter status 401

  @refresh
  @allure.label.suite:Refresh_de_Token
  @allure.severity.critical
  Cenário: Refresh token válido retorna novos tokens
    Dado que realizei login com email "admin@secure.com" e senha "Senha@123"
    E salvo o refresh token retornado
    Quando renovo a sessão com o refresh token salvo
    Então a resposta deve ter status 200
    E a resposta de autenticação deve conter accessToken e refreshToken
    E o novo refresh token deve ser diferente do anterior

  @logout
  @allure.label.suite:Logout
  @allure.severity.critical
  Cenário: Logout invalida o refresh token anterior
    Dado que realizei login com email "admin@secure.com" e senha "Senha@123"
    E salvo o refresh token retornado
    Quando faço logout com o token de acesso salvo
    Então a resposta deve ter status 204
    Quando renovo a sessão com o refresh token salvo
    Então a resposta deve ter status 400

  @protecao
  @allure.label.suite:Protecao_de_Endpoints
  @allure.severity.blocker
  Cenário: Listagem de ativos sem autenticação retorna 401
    Quando acesso a listagem de ativos sem autenticação
    Então a resposta deve ter status 401

  @login @validacao
  @allure.label.suite:Login
  @allure.severity.normal
  Cenário: Login com formato de email inválido retorna 400
    Quando realizo login com email "nao-e-um-email" e senha "Senha@123"
    Então a resposta deve ter status 400

  @login @validacao
  @allure.label.suite:Login
  @allure.severity.normal
  Cenário: Login com email em branco retorna 400
    Quando realizo login com email "" e senha "Senha@123"
    Então a resposta deve ter status 400

  @login @validacao
  @allure.label.suite:Login
  @allure.severity.normal
  Cenário: Login com senha em branco retorna 400
    Quando realizo login com email "admin@secure.com" e senha ""
    Então a resposta deve ter status 400

  @refresh @validacao
  @allure.label.suite:Refresh_de_Token
  @allure.severity.critical
  Cenário: Refresh com token inválido retorna 400
    Quando renovo a sessão com token inválido "token-invalido-qualquer"
    Então a resposta deve ter status 400

  @refresh @validacao
  @allure.label.suite:Refresh_de_Token
  @allure.severity.critical
  Cenário: Refresh sem enviar token retorna 400
    Quando renovo a sessão sem enviar token
    Então a resposta deve ter status 400

  @logout @autorizacao
  @allure.label.suite:Logout
  @allure.severity.critical
  Cenário: Logout sem autenticação retorna 401
    Quando faço logout sem autenticação
    Então a resposta deve ter status 401

  @login @validacao
  @allure.label.suite:Login
  @allure.severity.normal
  Cenário: Login com email contendo apenas espaços retorna 400
    Quando realizo login com email "   " e senha "Senha@123"
    Então a resposta deve ter status 400

  @login @validacao
  @allure.label.suite:Login
  @allure.severity.normal
  Cenário: Login com senha contendo apenas espaços retorna 400
    Quando realizo login com email "admin@secure.com" e senha "   "
    Então a resposta deve ter status 400

  @refresh @validacao
  @allure.label.suite:Refresh_de_Token
  @allure.severity.critical
  Cenário: Refresh com accessToken no lugar do refreshToken retorna 400
    Dado que realizei login com email "admin@secure.com" e senha "Senha@123"
    Quando renovo a sessão com token inválido "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIn0.invalidsig"
    Então a resposta deve ter status 400
