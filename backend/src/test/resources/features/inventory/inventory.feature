# language: pt
# Projeto: Patrimonio 360
# Dominio: Inventory

@inventory
@allure.label.parentSuite:Backend
@allure.label.epic:Gestao_de_Inventory
Funcionalidade: Seguranca e Acesso do Modulo Inventory
  Como usuario autenticado
  Quero acessar inventario respeitando autenticacao e autorizacao
  Para garantir protecao dos endpoints criticos

  Contexto:
    Dado que existe uma organização "Acme Corp" cadastrada
    E que existe uma unidade "Unidade Central" nessa organização
    E que existe um usuário ADMIN com email "admin@acme.com" e senha "Senha@123"
    E que existe um usuário GESTOR com email "gestor@acme.com" e senha "Senha@123"
    E que existe um usuário OPERADOR com email "operador@acme.com" e senha "Senha@123"

  @critical
  @allure.severity.critical
  Cenário: INVENTORY fluxo principal com GESTOR retorna sucesso
    Quando acesso o endpoint de sucesso do módulo "inventory" autenticado como "gestor@acme.com" com senha "Senha@123"
    Então a resposta deve ter status 200

  @blocker
  @allure.severity.blocker
  Cenário: INVENTORY sem autenticacao retorna 401
    Quando acesso o endpoint de sucesso do módulo "inventory" sem autenticação
    Então a resposta deve ter status 401

  @critical
  @allure.severity.critical
  Cenário: INVENTORY com papel sem permissao retorna 403
    Quando acesso o endpoint restrito do módulo "inventory" autenticado como "operador@acme.com" com senha "Senha@123"
    Então a resposta deve ter status 403

  @blocker
  @allure.severity.blocker
  Cenário: INVENTORY com JWT invalido retorna 401
    Quando acesso o endpoint de sucesso do módulo "inventory" com token inválido "jwt.invalido.inventory"
    Então a resposta deve ter status 401
