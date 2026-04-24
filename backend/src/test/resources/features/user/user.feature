# language: pt
# Projeto: Patrimonio 360
# Dominio: User

@user
@allure.label.testType:E2E
@allure.label.module:User
@allure.label.parentSuite:Backend
@allure.label.epic:Gestao_de_User
Funcionalidade: Seguranca e Acesso do Modulo User
  Como usuario autenticado
  Quero acessar usuarios respeitando autenticacao e autorizacao
  Para garantir protecao dos endpoints criticos

  Contexto:
    Dado que existe uma organização "Acme Corp" cadastrada
    E que existe uma unidade "Unidade Central" nessa organização
    E que existe um usuário ADMIN com email "admin@acme.com" e senha "Senha@123"
    E que existe um usuário GESTOR com email "gestor@acme.com" e senha "Senha@123"
    E que existe um usuário OPERADOR com email "operador@acme.com" e senha "Senha@123"

  @critical
  @allure.severity.critical
  Cenário: USER fluxo principal com ADMIN retorna sucesso
    Quando acesso o endpoint de sucesso do módulo "user" autenticado como "admin@acme.com" com senha "Senha@123"
    Então a resposta deve ter status 201

  @blocker
  @allure.severity.blocker
  Cenário: USER sem autenticacao retorna 401
    Quando acesso o endpoint de sucesso do módulo "user" sem autenticação
    Então a resposta deve ter status 401

  @critical
  @allure.severity.critical
  Cenário: USER com papel sem permissao retorna 403
    Quando acesso o endpoint restrito do módulo "user" autenticado como "gestor@acme.com" com senha "Senha@123"
    Então a resposta deve ter status 403

  @blocker
  @allure.severity.blocker
  Cenário: USER com JWT invalido retorna 401
    Quando acesso o endpoint de sucesso do módulo "user" com token inválido "jwt.invalido.user"
    Então a resposta deve ter status 401
