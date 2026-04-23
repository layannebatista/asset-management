# language: pt
# Projeto: Patrimonio 360
# Dominio: Organization

@organization
@allure.label.parentSuite:Backend
@allure.label.epic:Gestao_de_Organization
Funcionalidade: Seguranca e Acesso do Modulo Organization
  Como usuario autenticado
  Quero acessar organizacoes respeitando autenticacao e autorizacao
  Para garantir protecao dos endpoints criticos

  Contexto:
    Dado que existe uma organização "Acme Corp" cadastrada
    E que existe uma unidade "Unidade Central" nessa organização
    E que existe um usuário ADMIN com email "admin@acme.com" e senha "Senha@123"
    E que existe um usuário GESTOR com email "gestor@acme.com" e senha "Senha@123"
    E que existe um usuário OPERADOR com email "operador@acme.com" e senha "Senha@123"

  @critical
  @allure.severity.critical
  Cenário: ORGANIZATION fluxo principal com ADMIN retorna sucesso
    Quando acesso o endpoint de sucesso do módulo "organization" autenticado como "admin@acme.com" com senha "Senha@123"
    Então a resposta deve ter status 200

  @blocker
  @allure.severity.blocker
  Cenário: ORGANIZATION sem autenticacao retorna 401
    Quando acesso o endpoint de sucesso do módulo "organization" sem autenticação
    Então a resposta deve ter status 401

  @critical
  @allure.severity.critical
  Cenário: ORGANIZATION com papel sem permissao retorna 403
    Quando acesso o endpoint restrito do módulo "organization" autenticado como "gestor@acme.com" com senha "Senha@123"
    Então a resposta deve ter status 403

  @blocker
  @allure.severity.blocker
  Cenário: ORGANIZATION com JWT invalido retorna 401
    Quando acesso o endpoint de sucesso do módulo "organization" com token inválido "jwt.invalido.organization"
    Então a resposta deve ter status 401
