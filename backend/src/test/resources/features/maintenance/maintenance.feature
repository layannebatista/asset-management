# language: pt
# @maintenance é a tag que identifica esta feature
# Use no CucumberTestSuite para rodar apenas este arquivo:
# @ConfigurationParameter(key = FILTER_TAGS_PROPERTY_NAME, value = "@maintenance")

@maintenance
Funcionalidade: Gerenciamento de Manutenção de Ativos
  Como gestor ou administrador do sistema
  Quero gerenciar o ciclo de vida das manutenções de ativos
  Para garantir que os ativos sejam mantidos corretamente e com rastreabilidade

  # =========================================================
  # CONTEXTO — executado antes de cada cenário desta feature
  # =========================================================

  Contexto:
    Dado que existe uma organização "Acme Corp" cadastrada
    E que existe uma unidade "Unidade Central" nessa organização
    E que existe um ativo "ASSET-001" disponível nessa unidade
    E que existe um usuário ADMIN com email "admin@acme.com" e senha "Senha@123"
    E que existe um usuário GESTOR com email "gestor@acme.com" e senha "Senha@123"
    E que existe um usuário OPERADOR com email "operador@acme.com" e senha "Senha@123"

  # =========================================================
  # CRIAÇÃO DE MANUTENÇÃO
  # =========================================================

  @criacao
  Cenário: ADMIN cria manutenção com sucesso
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Teclado com teclas travadas"
    Então a resposta deve ter status 201
    E o status da manutenção deve ser "REQUESTED"
    E o ativo "ASSET-001" deve ter status "IN_MAINTENANCE"

  @criacao
  Cenário: GESTOR cria manutenção com sucesso
    Dado que estou autenticado como "gestor@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Teclado com teclas travadas"
    Então a resposta deve ter status 201
    E o status da manutenção deve ser "REQUESTED"

  @criacao @autorizacao
  Cenário: OPERADOR não pode criar manutenção
    Dado que estou autenticado como "operador@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Teclado com teclas travadas"
    Então a resposta deve ter status 403

  @criacao @validacao
  Cenário: Descrição muito curta é rejeitada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Curta"
    Então a resposta deve ter status 400

  @criacao @regra-negocio
  Cenário: Ativo em manutenção não pode receber nova manutenção
    Dado que existe um ativo "ASSET-MANUT" em manutenção nessa unidade
    E que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-MANUT" com descrição "Tentativa de nova manutenção"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "manutenção ativa"

  @criacao @regra-negocio
  Cenário: Ativo aposentado não pode receber manutenção
    Dado que existe um ativo "ASSET-RETIRED" aposentado nessa unidade
    E que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-RETIRED" com descrição "Tentativa em ativo aposentado"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode entrar em manutenção"

  # =========================================================
  # FLUXO COMPLETO — encadeamento de steps
  # =========================================================

  @fluxo-completo
  Cenário: Fluxo completo de manutenção — criar, iniciar e concluir
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Notebook com bateria viciada"
    Então a resposta deve ter status 201
    E salvo o ID da manutenção criada

    Quando inicio a manutenção salva
    Então a resposta deve ter status 200
    E o status da manutenção deve ser "IN_PROGRESS"

    Quando concluo a manutenção salva com resolução "Bateria substituída por nova"
    Então a resposta deve ter status 200
    E o status da manutenção deve ser "COMPLETED"
    E o ativo "ASSET-001" deve ter status "AVAILABLE"

  # =========================================================
  # INICIAR MANUTENÇÃO
  # =========================================================

  @iniciar
  Cenário: Não é possível iniciar manutenção que já está IN_PROGRESS
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para iniciar"
    E que iniciei essa manutenção
    Quando inicio a manutenção salva
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode ser iniciada"

  # =========================================================
  # CONCLUIR MANUTENÇÃO
  # =========================================================

  @concluir @validacao
  Cenário: Concluir manutenção sem informar resolução é rejeitado
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para concluir"
    E que iniciei essa manutenção
    Quando concluo a manutenção salva com resolução ""
    Então a resposta deve ter status 400

  @concluir @regra-negocio
  Cenário: Não é possível concluir manutenção que está REQUESTED
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para teste"
    Quando concluo a manutenção salva com resolução "Resolução tentada antes de iniciar"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode ser concluída"

  # =========================================================
  # CANCELAR MANUTENÇÃO
  # =========================================================

  @cancelar
  Cenário: ADMIN cancela manutenção REQUESTED com sucesso
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para cancelar"
    Quando cancelo a manutenção salva
    Então a resposta deve ter status 200
    E o status da manutenção deve ser "CANCELLED"
    E o ativo "ASSET-001" deve ter status "AVAILABLE"

  @cancelar @regra-negocio
  Cenário: Não é possível cancelar manutenção COMPLETED
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para concluir"
    E que iniciei essa manutenção
    E que concluí essa manutenção com resolução "Resolução válida aqui"
    Quando cancelo a manutenção salva
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "concluída"

  # =========================================================
  # SCENARIO OUTLINE — mesmo fluxo com dados diferentes
  # =========================================================

  @autorizacao
  Esquema do Cenário: Apenas ADMIN e GESTOR podem criar manutenção
    Dado que estou autenticado como "<email>" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Teclado com teclas travadas"
    Então a resposta deve ter status <status_esperado>

    Exemplos:
      | email               | status_esperado |
      | admin@acme.com      | 201             |
      | gestor@acme.com     | 201             |
      | operador@acme.com   | 403             |
