# language: pt
# Projeto: Patrimônio 360
# Domínio: Transferência de Ativos
# Executar com: mvn test -Dtest=CucumberRunnerTest

@transfer
@allure.label.parentSuite:Backend
@allure.label.epic:Gestao_de_Transferencias
Funcionalidade: Ciclo de Vida de Transferência de Ativos
  Como administrador ou gestor do sistema
  Quero solicitar e concluir transferências entre unidades
  Para garantir movimentação rastreável e segura dos ativos

  Contexto:
    Dado que existe uma organização "Acme Corp" cadastrada
    E que existe uma unidade "Unidade Central" nessa organização
    E que existe um ativo "ASSET-001" disponível nessa unidade
    E que existe um usuário ADMIN com email "admin@acme.com" e senha "Senha@123"
    E que existe um usuário GESTOR com email "gestor@acme.com" e senha "Senha@123"
    E que existe um usuário OPERADOR com email "operador@acme.com" e senha "Senha@123"
    E que existe uma unidade "Filial SP" como destino na mesma organização

  @criacao
  @allure.label.suite:Criacao_de_Transferencia
  @allure.severity.critical
  Cenário: ADMIN solicita transferência com sucesso
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Redistribuição planejada entre unidades para atendimento operacional"
    Então a resposta deve ter status 201
    E o status da transferência salva deve ser "PENDING"
    E o ativo "ASSET-001" deve ficar com status "IN_TRANSFER"

  @fluxo-completo
  @allure.label.suite:Fluxo_Completo
  @allure.severity.blocker
  Cenário: Criar então Aprovar então Concluir transferência com sucesso
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Movimentação definitiva para expansão da equipe local"
    Então a resposta deve ter status 201
    Quando aprovo a transferência salva com comentário "Aprovado para recebimento"
    Então a resposta deve ter status 204
    E o status da transferência salva deve ser "APPROVED"
    Quando concluo a transferência salva
    Então a resposta deve ter status 204
    E o status da transferência salva deve ser "COMPLETED"
    E o ativo "ASSET-001" deve ficar com status "AVAILABLE"
    E o ativo "ASSET-001" deve estar na unidade de destino

  @rejeicao
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Rejeitar transferência pendente devolve o ativo para disponível
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Tentativa de movimentação que será rejeitada"
    Então a resposta deve ter status 201
    Quando rejeito a transferência salva com comentário "Destino sem capacidade para receber"
    Então a resposta deve ter status 204
    E o status da transferência salva deve ser "REJECTED"
    E o ativo "ASSET-001" deve ficar com status "AVAILABLE"

  @cancelamento
  @allure.label.suite:Cancelamento_de_Transferencia
  @allure.severity.normal
  Cenário: Cancelar transferência pendente devolve o ativo para disponível
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Transferência aberta para cancelamento posterior"
    Então a resposta deve ter status 201
    Quando cancelo a transferência salva
    Então a resposta deve ter status 204
    E o status da transferência salva deve ser "CANCELLED"
    E o ativo "ASSET-001" deve ficar com status "AVAILABLE"

  @validacao
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Transferência para a mesma unidade é rejeitada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que a unidade de destino é a própria unidade de origem
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Tentativa inválida para mesma unidade"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "mesma unidade"

  @validacao
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Não deve concluir transferência sem aprovação
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Transferência que não deve concluir sem aprovação"
    Então a resposta deve ter status 201
    Quando concluo a transferência salva
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "aprovada"

  @validacao
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: POST sem assetId retorna 400
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência sem assetId para a unidade de destino com motivo "Motivo válido para transferência sem ativo"
    Então a resposta deve ter status 400

  @validacao
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: POST sem toUnitId retorna 400
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" sem unidade de destino com motivo "Motivo válido para transferência sem unidade"
    Então a resposta deve ter status 400

  @validacao
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: POST sem reason retorna 400
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino sem motivo
    Então a resposta deve ter status 400

  @autorizacao
  @allure.label.suite:Controle_de_Acesso
  @allure.severity.critical
  Cenário: OPERADOR não pode aprovar transferência
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Transferência para teste de autorização de aprovação"
    Então a resposta deve ter status 201
    Dado que estou autenticado como "operador@acme.com" com senha "Senha@123"
    Quando aprovo a transferência salva com comentário "Tentativa indevida de aprovação"
    Então a resposta deve ter status 403

  @cancelamento @regra-negocio
  @allure.label.suite:Cancelamento_de_Transferencia
  @allure.severity.normal
  Cenário: Cancelar transferência já aprovada retorna 400
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Transferência para cancelar após aprovação"
    Então a resposta deve ter status 201
    Quando aprovo a transferência salva com comentário "Aprovada para teste de cancelamento"
    Então a resposta deve ter status 204
    Quando cancelo a transferência salva
    Então a resposta deve ter status 400

  @validacao @whitespace
  @allure.label.suite:Validacao_de_Dados
  @allure.severity.normal
  Cenário: Motivo contendo apenas espaços é rejeitado
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "   "
    Então a resposta deve ter status 400

  @criacao @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Ativo em manutenção não pode ser transferido
    Dado que existe um ativo "ASSET-MANUT" em manutenção nessa unidade
    E que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-MANUT" para a unidade de destino com motivo "Tentativa de transferência de ativo em manutenção"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode ser transferido"

  @criacao @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Ativo atribuído não pode ser transferido
    Dado que existe um ativo "ASSET-ASSIGNED" atribuído nessa unidade
    E que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-ASSIGNED" para a unidade de destino com motivo "Tentativa de transferência de ativo já atribuído"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode ser transferido"

  @criacao @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Ativo aposentado não pode ser transferido
    Dado que existe um ativo "ASSET-RETIRED" aposentado nessa unidade
    E que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-RETIRED" para a unidade de destino com motivo "Tentativa de transferência de ativo aposentado"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode ser transferido"

  @aprovacao @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Não deve aprovar transferência já aprovada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Transferência para testar dupla aprovação"
    Então a resposta deve ter status 201
    Quando aprovo a transferência salva com comentário "Primeira aprovação"
    Então a resposta deve ter status 204
    Quando aprovo a transferência salva com comentário "Tentativa de segunda aprovação"
    Então a resposta deve ter status 400

  @rejeicao @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Não deve rejeitar transferência já rejeitada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Transferência para testar dupla rejeição"
    Então a resposta deve ter status 201
    Quando rejeito a transferência salva com comentário "Primeira rejeição"
    Então a resposta deve ter status 204
    Quando rejeito a transferência salva com comentário "Tentativa de segunda rejeição"
    Então a resposta deve ter status 400

  @rejeicao @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Não deve rejeitar transferência já aprovada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Transferência para testar rejeição após aprovação"
    Então a resposta deve ter status 201
    Quando aprovo a transferência salva com comentário "Aprovação antes de rejeição"
    Então a resposta deve ter status 204
    Quando rejeito a transferência salva com comentário "Tentativa de rejeição após aprovação"
    Então a resposta deve ter status 400

  @conclusao @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Não deve concluir transferência rejeitada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Transferência para testar conclusão de rejeitada"
    Então a resposta deve ter status 201
    Quando rejeito a transferência salva com comentário "Rejeitada antes da conclusão"
    Então a resposta deve ter status 204
    Quando concluo a transferência salva
    Então a resposta deve ter status 400

  @conclusao @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Não deve concluir transferência cancelada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Transferência para testar conclusão de cancelada"
    Então a resposta deve ter status 201
    Quando cancelo a transferência salva
    Então a resposta deve ter status 204
    Quando concluo a transferência salva
    Então a resposta deve ter status 400

  @cancelamento @regra-negocio
  @allure.label.suite:Cancelamento_de_Transferencia
  @allure.severity.normal
  Cenário: Não deve cancelar transferência já cancelada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Transferência para testar duplo cancelamento"
    Então a resposta deve ter status 201
    Quando cancelo a transferência salva
    Então a resposta deve ter status 204
    Quando cancelo a transferência salva
    Então a resposta deve ter status 400

  @conclusao @regra-negocio
  @allure.label.suite:Regras_de_Negocio
  @allure.severity.normal
  Cenário: Não deve concluir transferência completada
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito transferência do ativo "ASSET-001" para a unidade de destino com motivo "Transferência para testar conclusão dupla"
    Então a resposta deve ter status 201
    Quando aprovo a transferência salva com comentário "Aprovada para conclusão"
    Então a resposta deve ter status 204
    Quando concluo a transferência salva
    Então a resposta deve ter status 204
    Quando concluo a transferência salva
    Então a resposta deve ter status 400
