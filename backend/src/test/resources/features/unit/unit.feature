# language: pt
# Projeto: Patrimonio 360
# Dominio: Unit

@unit
@allure.label.testType:E2E
@allure.label.module:Unit
@allure.label.parentSuite:Backend
@allure.label.epic:Gestao_de_Unit
Funcionalidade: Seguranca e Acesso do Modulo Unit
  Como usuario autenticado
  Quero acessar unidades respeitando autenticacao e autorizacao
  Para garantir protecao dos endpoints criticos

  Contexto:
    Dado que existe uma organização "Acme Corp" cadastrada
    E que existe uma unidade "Unidade Central" nessa organização
    E que existe um usuário ADMIN com email "admin@acme.com" e senha "Senha@123"
    E que existe um usuário GESTOR com email "gestor@acme.com" e senha "Senha@123"
    E que existe um usuário OPERADOR com email "operador@acme.com" e senha "Senha@123"

  @critical
  @allure.severity.critical
  Cenário: UNIT fluxo principal com GESTOR retorna sucesso
    Quando acesso o endpoint de sucesso do módulo "unit" autenticado como "gestor@acme.com" com senha "Senha@123"
    Então a resposta deve ter status 200

  @blocker
  @allure.severity.blocker
  Cenário: UNIT sem autenticacao retorna 401
    Quando acesso o endpoint de sucesso do módulo "unit" sem autenticação
    Então a resposta deve ter status 401

  @critical
  @allure.severity.critical
  Cenário: UNIT com papel sem permissao retorna 403
    Quando acesso o endpoint restrito do módulo "unit" autenticado como "operador@acme.com" com senha "Senha@123"
    Então a resposta deve ter status 403

  @blocker
  @allure.severity.blocker
  Cenário: UNIT com JWT invalido retorna 401
    Quando acesso o endpoint de sucesso do módulo "unit" com token inválido "jwt.invalido.unit"
    Então a resposta deve ter status 401
