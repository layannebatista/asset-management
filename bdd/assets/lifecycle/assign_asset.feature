Feature: Atribuição de ativo a usuário

  Como gestor da organização
  Quero atribuir um ativo a um usuário
  Para controlar a responsabilidade e uso do ativo

  Background:
    Given que existe uma organização ativa
    And que existe uma unidade ativa
    And que existe um usuário ativo
    And que existe um ativo disponível
    And que estou autenticado como gestor da organização

  Scenario Outline: Atribuir ativo com diferentes condições
    When eu solicito a atribuição do ativo <assetId> ao usuário <userId>
    Then o sistema deve retornar o status <status>
    And o resultado deve ser "<resultado>"

    Examples:
      | assetId | userId | status | resultado                                |
      | 1001    | 2001   | 200    | ativo atribuído com sucesso              |
      | 1001    | 9999   | 404    | usuário não encontrado                   |
      | 9999    | 2001   | 404    | ativo não encontrado                     |
      | 1002    | 2002   | 400    | ativo já está atribuído                  |
      | 1003    | 2003   | 403    | usuário pertence a outra organização     |
