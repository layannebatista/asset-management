# language: pt
# Projeto: Patrimônio 360
# Domínio: Autenticação
# Executar com: mvn test -Dtest=CucumberRunnerTest

@auth
@allure.label.testType:E2E
@allure.label.module:Auth
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
  @mfa @validacao
  @allure.label.suite:MFA
  @allure.severity.normal
  Cenário: Verificação MFA sem code retorna 400
    E que existe um usuário "ADMIN" com email "admin-mfa-nocode@secure.com" e senha "Senha@123" e telefone "5511955555555"
    Quando realizo login com email "admin-mfa-nocode@secure.com" e senha "Senha@123"
    Então a resposta deve ter status 200
    E a resposta deve indicar MFA obrigatório
    Quando verifico o MFA sem enviar o campo code para o usuário salvo
    Então a resposta deve ter status 400

  @mfa @validacao
  @allure.label.suite:MFA
  @allure.severity.normal
  Cenário: Verificação MFA sem userId retorna 400
    Quando verifico o MFA sem enviar o campo userId com o código "123456"
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

  @login @mfa
  @allure.label.suite:MFA
  @allure.severity.critical
  Cenário: Login de usuário com telefone retorna challenge MFA sem tokens
    E que existe um usuário "ADMIN" com email "admin-mfa@secure.com" e senha "Senha@123" e telefone "5511999999999"
    Quando realizo login com email "admin-mfa@secure.com" e senha "Senha@123"
    Então a resposta deve ter status 200
    E a resposta deve indicar MFA obrigatório

  @protecao @seguranca
  @allure.label.suite:Protecao_de_Endpoints
  @allure.severity.normal
  Cenário: Endpoint protegido com token sem prefixo Bearer retorna 401
    Quando acesso a listagem de ativos com token sem prefixo Bearer "token-sem-bearer"
    Então a resposta deve ter status 401

  @mfa
  @allure.label.suite:MFA
  @allure.severity.critical
  Cenário: Verificação MFA com código válido retorna tokens
    E que existe um usuário "ADMIN" com email "admin-mfa-verify@secure.com" e senha "Senha@123" e telefone "5511988888888"
    Quando realizo login com email "admin-mfa-verify@secure.com" e senha "Senha@123"
    Então a resposta deve ter status 200
    E a resposta deve indicar MFA obrigatório
    Quando verifico o MFA com o código gerado para o usuário salvo
    Então a resposta deve ter status 200
    E a resposta de autenticação deve conter accessToken e refreshToken

  @login @seguranca
  @allure.label.suite:Login
  @allure.severity.blocker
  Cenário: Login com usuário pendente de ativação retorna 401
    E que existe um usuário "ADMIN" com email "pending@secure.com" e senha "Senha@123" no status "PENDING_ACTIVATION"
    Quando realizo login com email "pending@secure.com" e senha "Senha@123"
    Então a resposta deve ter status 401

  @login @seguranca
  @allure.label.suite:Login
  @allure.severity.blocker
  Cenário: Login com usuário bloqueado retorna 401
    E que existe um usuário "ADMIN" com email "blocked@secure.com" e senha "Senha@123" no status "BLOCKED"
    Quando realizo login com email "blocked@secure.com" e senha "Senha@123"
    Então a resposta deve ter status 401

  @login @seguranca
  @allure.label.suite:Login
  @allure.severity.blocker
  Cenário: Login com usuário inativo retorna 401
    E que existe um usuário "ADMIN" com email "inactive@secure.com" e senha "Senha@123" no status "INACTIVE"
    Quando realizo login com email "inactive@secure.com" e senha "Senha@123"
    Então a resposta deve ter status 401

  @refresh @seguranca
  @allure.label.suite:Refresh_de_Token
  @allure.severity.critical
  Cenário: Refresh token já rotacionado não pode ser reutilizado
    Dado que realizei login com email "admin@secure.com" e senha "Senha@123"
    E salvo o refresh token retornado
    Quando renovo a sessão com o refresh token salvo
    Então a resposta deve ter status 200
    E o novo refresh token deve ser diferente do anterior
    Quando renovo a sessão novamente com o refresh token anterior
    Então a resposta deve ter status 400

  @logout @seguranca
  @allure.label.suite:Logout
  @allure.severity.critical
  Cenário: Logout revoga todos os refresh tokens ativos do usuário
    Dado que realizei login com email "admin@secure.com" e senha "Senha@123"
    E salvo o refresh token retornado
    Dado que realizei login com email "admin@secure.com" e senha "Senha@123"
    E salvo o refresh token retornado como secundário
    Quando faço logout com o token de acesso salvo
    Então a resposta deve ter status 204
    Quando renovo a sessão com o refresh token salvo
    Então a resposta deve ter status 400
    Quando renovo a sessão com o refresh token secundário salvo
    Então a resposta deve ter status 400

  @login @rate-limit
  @allure.label.suite:Rate_Limit
  @allure.severity.blocker
  Cenário: Rate limit de login retorna 429 após excesso de tentativas
    Quando realizo login com email "admin@secure.com" e senha "SenhaErrada!" a partir do IP "10.10.10.10" por 11 tentativas
    Então a resposta deve ter status 429
    E a resposta deve conter o header "Retry-After" com valor "60"

  @mfa @validacao
  @allure.label.suite:MFA
  @allure.severity.critical
  Cenário: Verificação MFA com código incorreto retorna 400
    E que existe um usuário "ADMIN" com email "admin-mfa-wrong@secure.com" e senha "Senha@123" e telefone "5511977777777"
    Quando realizo login com email "admin-mfa-wrong@secure.com" e senha "Senha@123"
    Então a resposta deve ter status 200
    E a resposta deve indicar MFA obrigatório
    Quando verifico o MFA com código inválido "000000" para o usuário salvo
    Então a resposta deve ter status 400

  @mfa @seguranca
  @allure.label.suite:MFA
  @allure.severity.critical
  Cenário: Código MFA não pode ser reutilizado após uso bem sucedido
    E que existe um usuário "ADMIN" com email "admin-mfa-reuse@secure.com" e senha "Senha@123" e telefone "5511966666666"
    Quando realizo login com email "admin-mfa-reuse@secure.com" e senha "Senha@123"
    Então a resposta deve ter status 200
    E a resposta deve indicar MFA obrigatório
    Quando verifico o MFA com o código gerado para o usuário salvo
    Então a resposta deve ter status 200
    Quando verifico novamente o mesmo código MFA do usuário salvo
    Então a resposta deve ter status 400

  @protecao @seguranca
  @allure.label.suite:Protecao_de_Endpoints
  @allure.severity.critical
  Cenário: Endpoint protegido com token inválido retorna 401
    Quando acesso a listagem de ativos com token inválido "token-que-nao-e-jwt"
    Então a resposta deve ter status 401

  @mfa @rate-limit
  @allure.label.suite:Rate_Limit
  @allure.severity.blocker
  Cenário: Rate limit de MFA retorna 429 após excesso de tentativas
    E que existe um usuário "ADMIN" com email "admin-mfa-limit@secure.com" e senha "Senha@123" e telefone "5511955555555"
    Quando realizo login com email "admin-mfa-limit@secure.com" e senha "Senha@123"
    Então a resposta deve ter status 200
    E a resposta deve indicar MFA obrigatório
    Quando verifico MFA com código inválido "000000" para o usuário salvo a partir do IP "10.10.10.30" por 6 tentativas
    Então a resposta deve ter status 429
    E a resposta deve conter o header "Retry-After" com valor "60"

  @refresh @rate-limit
  @allure.label.suite:Rate_Limit
  @allure.severity.blocker
  Cenário: Rate limit de refresh retorna 429 após excesso de tentativas
    Quando renovo a sessão com token inválido "refresh-invalido" a partir do IP "10.10.10.20" por 31 tentativas
    Então a resposta deve ter status 429
    E a resposta deve conter o header "Retry-After" com valor "60"

  @protecao @seguranca
  @allure.label.suite:Seguranca_JWT
  @allure.severity.blocker
  Cenário: JWT com algoritmo none é rejeitado com 401
    Quando acesso a listagem de ativos com token inválido "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbkBzZWN1cmUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ."
    Então a resposta deve ter status 401

  @protecao @seguranca
  @allure.label.suite:Seguranca_JWT
  @allure.severity.blocker
  Cenário: JWT com payload adulterado retorna 401
    Quando acesso a listagem de ativos com token inválido "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmb3JnZWRAYXR0YWNrZXIuY29tIiwicm9sZSI6IkFETUlOIiwiZXhwIjo5OTk5OTk5OTk5fQ.invalidsignatureXXXXXXXXXXXXXXXX"
    Então a resposta deve ter status 401

  @refresh @seguranca
  @allure.label.suite:Refresh_de_Token
  @allure.severity.critical
  Cenário: Refresh token de usuário desativado retorna 400
    E que existe um usuário "ADMIN" com email "admin-to-disable@secure.com" e senha "Senha@123" no status "ACTIVE"
    Dado que realizei login com email "admin-to-disable@secure.com" e senha "Senha@123"
    E salvo o refresh token retornado
    E que o usuário com email "admin-to-disable@secure.com" é desativado
    Quando renovo a sessão com o refresh token salvo
    Então a resposta deve ter status 400
