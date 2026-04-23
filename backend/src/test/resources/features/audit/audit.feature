# language: pt
# Projeto: Patrimonio 360
# Dominio: Audit

@audit
@allure.label.parentSuite:Backend
@allure.label.epic:Gestao_de_Audit
Funcionalidade: Seguranca e Acesso do Modulo Audit
  Como usuario autenticado
  Quero acessar auditoria respeitando autenticacao e autorizacao
  Para garantir protecao dos endpoints criticos

  Contexto:
    Dado que existe uma organização "Acme Corp" cadastrada
    E que existe uma unidade "Unidade Central" nessa organização
    E que existe um usuário ADMIN com email "admin@acme.com" e senha "Senha@123"
    E que existe um usuário GESTOR com email "gestor@acme.com" e senha "Senha@123"
    E que existe um usuário OPERADOR com email "operador@acme.com" e senha "Senha@123"

  @critical
  @allure.severity.critical
  Cenário: AUDIT fluxo principal com GESTOR retorna sucesso
    Quando acesso o endpoint de sucesso do módulo "audit" autenticado como "gestor@acme.com" com senha "Senha@123"
    Então a resposta deve ter status 200

  @blocker
  @allure.severity.blocker
  Cenário: AUDIT sem autenticacao retorna 401
    Quando acesso o endpoint de sucesso do módulo "audit" sem autenticação
    Então a resposta deve ter status 401

  @critical
  @allure.severity.critical
  Cenário: AUDIT com papel sem permissao retorna 403
    Quando acesso o endpoint restrito do módulo "audit" autenticado como "operador@acme.com" com senha "Senha@123"
    Então a resposta deve ter status 403

  @blocker
  @allure.severity.blocker
  Cenário: AUDIT com JWT invalido retorna 401
    Quando acesso o endpoint de sucesso do módulo "audit" com token inválido "jwt.invalido.audit"
    Então a resposta deve ter status 401
