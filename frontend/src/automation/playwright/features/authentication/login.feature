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

  @allure.label.story:Login
  @allure.label.severity:critical
  Cenário: Login com gestor redireciona para dashboard
    Quando preencho o login com email "gestor@empresa.com" e senha "Gestor@123"
    E envio o formulário de login
    Então devo ser redirecionado para o dashboard

  @allure.label.story:Login
  @allure.label.severity:critical
  Cenário: Login com operador redireciona para dashboard
    Quando preencho o login com email "operador@empresa.com" e senha "Op@12345"
    E envio o formulário de login
    Então devo ser redirecionado para o dashboard

  @allure.label.story:Login
  @allure.label.severity:critical
  Cenário: Email inexistente exibe mensagem de erro sem vazar detalhes
    Quando preencho o login com email "naocadastrado@empresa.com" e senha "QualquerSenha123"
    E envio o formulário de login
    Então devo ver a mensagem de erro de login

  @allure.label.story:Login
  @allure.label.severity:critical
  @flaky
  Cenário: Senha incorreta exibe mensagem de erro sem vazar detalhes
    Quando preencho o login com email "admin@empresa.com" e senha "SenhaErrada999"
    E envio o formulário de login
    Então devo ver a mensagem de erro de login
    E a mensagem não deve revelar se o email existe

  @allure.label.story:Sessão
  @allure.label.severity:critical
  Cenário: Refresh de página preserva sessão válida
    Dado que estou autenticado como administrador no login
    Quando recarrego a página
    Então devo continuar autenticado no dashboard

  @allure.label.story:Sessão
  @allure.label.severity:critical
  Cenário: Sessão inválida remove credenciais e redireciona para login
    Dado que estou autenticado como administrador no login
    Quando invalido o token de sessão manualmente
    E recarrego a página
    Então devo ser redirecionado para o login

  @allure.label.story:Segurança
  @allure.label.severity:critical
  Cenário: GESTOR bloqueado em rota exclusiva de administrador
    Dado que estou autenticado como gestor no login
    Quando tento acessar a rota "/admin/users"
    Então devo ser redirecionado para o dashboard ou ver página de acesso negado

  @allure.label.story:Segurança
  @allure.label.severity:critical
  Cenário: OPERADOR bloqueado em rotas restritas
    Dado que estou autenticado como operador no login
    Quando tento acessar a rota "/transfers"
    Então devo ser redirecionado para o dashboard ou ver página de acesso negado

  @allure.label.story:MFA
  @allure.label.severity:blocker
  Cenário: Usuário com MFA entra na etapa de verificação
    Dado que o backend de login responde com challenge MFA para o usuário atual
    Quando preencho o login com email "admin.mfa@empresa.com" e senha "Senha@123"
    E envio o formulário de login
    Então devo ver a etapa de verificação MFA

  @allure.label.story:MFA
  @allure.label.severity:blocker
  Cenário: Código MFA válido redireciona para o dashboard
    Dado que o backend de login responde com challenge MFA para o usuário atual
    E que o backend de MFA valida o código "123456"
    Quando preencho o login com email "admin.mfa@empresa.com" e senha "Senha@123"
    E envio o formulário de login
    E preencho o código MFA com "123456"
    E envio o formulário MFA
    Então devo ser redirecionado para o dashboard

  @allure.label.story:MFA
  @allure.label.severity:critical
  Cenário: Código MFA inválido exibe erro
    Dado que o backend de login responde com challenge MFA para o usuário atual
    E que o backend de MFA rejeita o código "000000" com a mensagem "Código inválido"
    Quando preencho o login com email "admin.mfa@empresa.com" e senha "Senha@123"
    E envio o formulário de login
    E preencho o código MFA com "000000"
    E envio o formulário MFA
    Então devo ver a mensagem de erro de MFA "Código inválido"

  @allure.label.story:MFA
  @allure.label.severity:critical
  Cenário: Código MFA expirado exibe mensagem correta
    Dado que o backend de login responde com challenge MFA para o usuário atual
    E que o backend de MFA rejeita o código "123456" com a mensagem "Código expirado"
    Quando preencho o login com email "admin.mfa@empresa.com" e senha "Senha@123"
    E envio o formulário de login
    E preencho o código MFA com "123456"
    E envio o formulário MFA
    Então devo ver a mensagem de erro de MFA "Código expirado"

  @allure.label.story:Segurança
  @allure.label.severity:blocker
  Cenário: Acesso a rota protegida sem sessão redireciona para login
    Quando tento acessar a rota "/dashboard"
    Então devo ser redirecionado para o login
