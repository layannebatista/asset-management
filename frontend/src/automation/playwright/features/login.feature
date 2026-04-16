# language: pt

@frontend @playwright
@allure.label.epic:Frontend
@allure.label.feature:Autenticação_(E2E)

Funcionalidade: Autenticação (E2E)

  Como usuário do sistema
  Quero acessar a tela de login e autenticar com segurança
  Para entrar no sistema com o perfil correto

  Contexto:
    Dado que acesso a página de login sem sessão ativa

  @allure.label.story:Tela_de_login
  @allure.label.severity:normal
  Cenário: Exibir campos e perfis de demonstração
    Então devo ver o formulário de login
    E devo ver os perfis de demonstração disponíveis

  @allure.label.story:Tela_de_login
  @allure.label.severity:normal
  Cenário: Preencher credenciais a partir do perfil de demonstração
    Quando seleciono o perfil de demonstração "ADMIN"
    Então o email deve ser preenchido com "admin@empresa.com"

  @allure.label.story:Login
  @allure.label.severity:critical
  Cenário: Login com credenciais inválidas exibe erro
    Quando preencho o login com email "naoexiste@empresa.com" e senha "SenhaErrada123"
    E envio o formulário de login
    Então devo ver a mensagem de erro de login

  @allure.label.story:Login
  @allure.label.severity:blocker
  Cenário: Login com administrador acessa o dashboard
    Quando preencho o login com email "admin@empresa.com" e senha "Admin@123"
    E envio o formulário de login
    Então devo ser redirecionado para o dashboard
