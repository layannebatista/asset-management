# language: pt
# Projeto: Patrimônio 360
# Domínio: Manutenção de Ativos
# Executar com: mvn test -Dtest=CucumberRunnerTest

@maintenance
@allure.label.testType:E2E
@allure.label.module:Maintenance
@allure.label.parentSuite:Backend
@allure.label.epic:Gestao_de_Manutencao
Funcionalidade: Ciclo de Vida de Manutenção de Ativos
  Como gestor ou administrador do sistema
  Quero gerenciar o ciclo de vida das manutenções de ativos
  Para garantir que os ativos sejam mantidos corretamente e com rastreabilidade

  Contexto:
    Dado que existe uma organização "Acme Corp" cadastrada
    E que existe uma unidade "Unidade Central" nessa organização
    E que existe um ativo "ASSET-001" disponível nessa unidade
    E que existe um usuário ADMIN com email "admin@acme.com" e senha "Senha@123"
    E que existe um usuário GESTOR com email "gestor@acme.com" e senha "Senha@123"
    E que existe um usuário OPERADOR com email "operador@acme.com" e senha "Senha@123"

  @criacao
  @allure.label.suite:Criacao_de_Manutencao
  @allure.severity.critical
  Cenário: ADMIN cria solicitação de manutenção com sucesso
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Teclado com teclas travadas"
    Então a resposta deve ter status 201
    E o status da manutenção deve ser "REQUESTED"
    E o ativo "ASSET-001" deve ter status "IN_MAINTENANCE"

  @criacao
  @allure.label.suite:Criacao_de_Manutencao
  @allure.severity.critical
  Cenário: GESTOR cria solicitação de manutenção com sucesso
    Dado que estou autenticado como "gestor@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Teclado com teclas travadas"
    Então a resposta deve ter status 201
    E o status da manutenção deve ser "REQUESTED"

  @criacao @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Cenário: OPERADOR não tem permissão para criar manutenção
    Dado que estou autenticado como "operador@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Teclado com teclas travadas"
    Então a resposta deve ter status 403

  @criacao @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: Descrição com menos de 10 caracteres é rejeitada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Curta"
    Então a resposta deve ter status 400

  @criacao @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Ativo já em manutenção não aceita nova solicitação
    Dado que existe um ativo "ASSET-MANUT" em manutenção nessa unidade
    E que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-MANUT" com descrição "Tentativa de nova manutenção"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode entrar em manutenção"

  @criacao @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Ativo aposentado não aceita manutenção
    Dado que existe um ativo "ASSET-RETIRED" aposentado nessa unidade
    E que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-RETIRED" com descrição "Tentativa em ativo aposentado"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode entrar em manutenção"

  @fluxo-completo
  @allure.label.suite:Fluxo_Completo
  @allure.severity.blocker
  Cenário: Criar então Iniciar então Concluir manutenção com sucesso
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

  @iniciar @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Manutenção já em andamento não pode ser iniciada novamente
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para iniciar"
    E que iniciei essa manutenção
    Quando inicio a manutenção salva
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode ser iniciada"

  @concluir @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: Concluir manutenção sem resolução é rejeitado
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para concluir"
    E que iniciei essa manutenção
    Quando concluo a manutenção salva com resolução ""
    Então a resposta deve ter status 400

  @concluir @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Manutenção com status REQUESTED não pode ser concluída
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para teste"
    Quando concluo a manutenção salva com resolução "Resolução tentada antes de iniciar"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode ser concluída"

  @cancelar
  @allure.label.suite:Cancelamento_de_Manutencao
  @allure.severity.normal
  Cenário: ADMIN cancela manutenção REQUESTED e ativo volta a AVAILABLE
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para cancelar"
    Quando cancelo a manutenção salva
    Então a resposta deve ter status 200
    E o status da manutenção deve ser "CANCELLED"
    E o ativo "ASSET-001" deve ter status "AVAILABLE"

  @cancelar @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Manutenção COMPLETED não pode ser cancelada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para concluir"
    E que iniciei essa manutenção
    E que concluí essa manutenção com resolução "Resolução válida aqui"
    Quando cancelo a manutenção salva
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "concluída"

  @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Esquema do Cenário: Apenas ADMIN e GESTOR podem solicitar manutenção
    Dado que estou autenticado como "<email>" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Teclado com teclas travadas"
    Então a resposta deve ter status <status_esperado>

    Exemplos:
      | email             | status_esperado |
      | admin@acme.com    | 201             |
      | gestor@acme.com   | 201             |
      | operador@acme.com | 403             |

  @criacao @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: Descrição com mais de 1000 caracteres é rejeitada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição longa de 1001 caracteres
    Então a resposta deve ter status 400

  @criacao @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: Estimated cost igual a zero é rejeitado
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com custo estimado inválido de 0
    Então a resposta deve ter status 400

  @iniciar @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Manutenção COMPLETED não pode ser iniciada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para concluir e tentar reiniciar"
    E que iniciei essa manutenção
    E que concluí essa manutenção com resolução "Problema resolvido com sucesso"
    Quando inicio a manutenção salva
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode ser iniciada"

  @concluir @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: Concluir manutenção sem enviar parâmetro resolution retorna 400
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para concluir sem resolution"
    E que iniciei essa manutenção
    Quando concluo a manutenção salva sem enviar resolution
    Então a resposta deve ter status 400

  @criacao @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.critical
  Cenário: Ativo IN_TRANSFER não pode entrar em manutenção
    Dado que existe um ativo "ASSET-TRANSF" em transferência nessa unidade
    E que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-TRANSF" com descrição "Tentativa em ativo em transferência"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode entrar em manutenção"

  @criacao @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: Descrição contendo apenas espaços é rejeitada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "   "
    Então a resposta deve ter status 400

  @concluir @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: Resolução contendo apenas espaços é rejeitada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para testar whitespace"
    E que iniciei essa manutenção
    Quando concluo a manutenção salva com resolução "   "
    Então a resposta deve ter status 400

  @consulta
  @allure.label.suite:Consulta_de_Dados
  @allure.severity.critical
  Cenário: Listar manutenções de um ativo retorna 200
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Primeira manutenção para listar"
    E que cancelei essa manutenção
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Segunda manutenção para listar"
    Quando listo as manutenções do ativo "ASSET-001"
    Então a resposta deve ter status 200
    E a resposta deve conter at least 2 manutenções

  @criacao @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: Descrição vazia é rejeitada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição ""
    Então a resposta deve ter status 400

  @criacao @validacao
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: AssetId inválido retorna 404
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo com ID "999999" com descrição "Ativo que não existe"
    Então a resposta deve ter status 404

  @criacao @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Cenário: Criar manutenção sem autenticação retorna 401
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Tentativa sem autenticação" sem autenticação
    Então a resposta deve ter status 401

  @cancelar @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.normal
  Cenário: OPERADOR não pode cancelar manutenção
    Dado que existe um ativo "ASSET-CANCEL-OP" disponível nessa unidade
    E que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-CANCEL-OP" com descrição "Manutenção para OPERADOR não cancelar"
    E que estou autenticado como "operador@acme.com" com senha "Senha@123"
    Quando cancelo a manutenção salva
    Então a resposta deve ter status 403

  @cancelar @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Manutenção CANCELLED não pode ser cancelada novamente
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para duplo cancelamento"
    E que cancelei essa manutenção
    Quando cancelo a manutenção salva
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "cancelada"

  @concluir @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Manutenção CANCELLED não pode ser concluída
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção cancelada para tentar concluir"
    E que cancelei essa manutenção
    Quando concluo a manutenção salva com resolução "Tentativa inválida de conclusão"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode ser concluída"

  @fluxo-completo @regra-negocio
  @allure.label.suite:Fluxo_Completo
  @allure.severity.critical
  Cenário: Conclusão de manutenção restaura ativo para ASSIGNED quando havia usuário atribuído
    Dado que existe um ativo "ASSET-L09" atribuído nessa unidade
    E que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-L09" com descrição "Manutenção de ativo previamente atribuído"
    Então a resposta deve ter status 201
    E salvo o ID da manutenção criada
    Quando inicio a manutenção salva
    Então a resposta deve ter status 200
    Quando concluo a manutenção salva com resolução "Problema resolvido com sucesso"
    Então a resposta deve ter status 200
    E o ativo "ASSET-L09" deve ter status "ASSIGNED"

  @criacao @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Cenário: GESTOR não pode criar manutenção para ativo de outra unidade
    Dado que existe um ativo "ASSET-A05" disponível em outra unidade dessa organização
    E que estou autenticado como "gestor@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-A05" com descrição "Tentativa em ativo de outra unidade"
    Então a resposta deve ter status 403
