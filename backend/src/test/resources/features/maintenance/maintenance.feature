# language: pt
# Projeto: Patrimônio 360
# Domínio: Manutenção de Ativos
# Executar com: mvn test -Dtest=CucumberTestSuite

@maintenance
@allure.label.parentSuite:Backend
@allure.label.epic:Gestão de Manutenção
Funcionalidade: Ciclo de Vida de Manutenção de Ativos
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
  @allure.label.suite:Criação de Manutenção
  @allure.severity.critical
  Cenário: [ADMIN] Cria solicitação de manutenção com sucesso
    Verifica que um usuário com perfil ADMIN consegue abrir uma ordem de manutenção
    para um ativo disponível. Após a criação, o ativo deve mudar para status IN_MAINTENANCE
    e a manutenção deve ser registrada com status REQUESTED.
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Teclado com teclas travadas"
    Então a resposta deve ter status 201
    E o status da manutenção deve ser "REQUESTED"
    E o ativo "ASSET-001" deve ter status "IN_MAINTENANCE"

  @criacao
  @allure.label.suite:Criação de Manutenção
  @allure.severity.critical
  Cenário: [GESTOR] Cria solicitação de manutenção com sucesso
    Verifica que um usuário com perfil GESTOR também tem permissão para abrir ordens de
    manutenção. Ambos ADMIN e GESTOR compartilham esse privilégio no sistema.
    Dado que estou autenticado como "gestor@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Teclado com teclas travadas"
    Então a resposta deve ter status 201
    E o status da manutenção deve ser "REQUESTED"

  @criacao @autorizacao
  @allure.label.suite:Controle de Acesso
  @allure.severity.critical
  Cenário: [OPERADOR] Não tem permissão para criar manutenção — retorna 403
    Verifica que o perfil OPERADOR não possui autorização para criar ordens de manutenção.
    A API deve retornar 403 Forbidden. Este controle garante que apenas perfis responsáveis
    (ADMIN e GESTOR) possam iniciar fluxos de manutenção.
    Dado que estou autenticado como "operador@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Teclado com teclas travadas"
    Então a resposta deve ter status 403

  @criacao @validacao
  @allure.label.suite:Validação de Dados
  @allure.severity.normal
  Cenário: [Validação] Descrição com menos de 10 caracteres é rejeitada — retorna 400
    Verifica que a API aplica a regra de negócio de descrição mínima.
    Uma descrição muito curta não permite ao técnico entender o problema relatado,
    por isso o sistema exige no mínimo 10 caracteres para aceitar a solicitação.
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Curta"
    Então a resposta deve ter status 400

  @criacao @regra-negocio
  @allure.label.suite:Regras de Negócio
  @allure.severity.normal
  Cenário: [Regra de Negócio] Ativo já em manutenção não aceita nova solicitação — retorna 400
    Verifica que a API impede a criação de manutenção duplicada para o mesmo ativo.
    Um ativo com status IN_MAINTENANCE já possui uma ordem em aberto, portanto uma nova
    solicitação deve ser bloqueada para manter a integridade dos dados.
    Dado que existe um ativo "ASSET-MANUT" em manutenção nessa unidade
    E que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-MANUT" com descrição "Tentativa de nova manutenção"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "manutenção ativa"

  @criacao @regra-negocio
  @allure.label.suite:Regras de Negócio
  @allure.severity.normal
  Cenário: [Regra de Negócio] Ativo aposentado não aceita manutenção — retorna 400
    Verifica que ativos com status RETIRED não podem receber ordens de manutenção.
    Ativos aposentados foram descontinuados e não devem gerar custos operacionais.
    Dado que existe um ativo "ASSET-RETIRED" aposentado nessa unidade
    E que estou autenticado como "admin@acme.com" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-RETIRED" com descrição "Tentativa em ativo aposentado"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode entrar em manutenção"

  # =========================================================
  # FLUXO COMPLETO
  # =========================================================

  @fluxo-completo
  @allure.label.suite:Fluxo Completo
  @allure.severity.blocker
  Cenário: [Fluxo Completo] Criar → Iniciar → Concluir manutenção com sucesso
    Testa o ciclo de vida completo de uma manutenção em sequência:
    1. Criação da ordem (REQUESTED) → ativo vai para IN_MAINTENANCE
    2. Início dos trabalhos (IN_PROGRESS)
    3. Conclusão com resolução informada (COMPLETED) → ativo volta para AVAILABLE

    Este é o fluxo feliz principal e deve ser testado em toda execução de regressão.
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

  @iniciar @regra-negocio
  @allure.label.suite:Regras de Negócio
  @allure.severity.normal
  Cenário: [Regra de Negócio] Manutenção já em andamento não pode ser iniciada novamente — retorna 400
    Verifica que a transição de estado é unidirecional: uma manutenção IN_PROGRESS
    não pode voltar a ser iniciada. Isso protege a integridade do histórico de eventos
    e evita duplicidade de registros de início de trabalho.
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
  @allure.label.suite:Validação de Dados
  @allure.severity.normal
  Cenário: [Validação] Concluir manutenção sem resolução é rejeitado — retorna 400
    Verifica que a API exige o preenchimento da resolução ao concluir uma manutenção.
    A resolução documenta o que foi feito pelo técnico e é obrigatória para rastreabilidade
    do histórico de manutenção do ativo.
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para concluir"
    E que iniciei essa manutenção
    Quando concluo a manutenção salva com resolução ""
    Então a resposta deve ter status 400

  @concluir @regra-negocio
  @allure.label.suite:Regras de Negócio
  @allure.severity.normal
  Cenário: [Regra de Negócio] Manutenção com status REQUESTED não pode ser concluída — retorna 400
    Verifica que não é possível pular a etapa de início e concluir diretamente uma
    manutenção que ainda está REQUESTED. O fluxo obrigatório é: REQUESTED → IN_PROGRESS → COMPLETED.
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para teste"
    Quando concluo a manutenção salva com resolução "Resolução tentada antes de iniciar"
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "não pode ser concluída"

  # =========================================================
  # CANCELAR MANUTENÇÃO
  # =========================================================

  @cancelar
  @allure.label.suite:Cancelamento de Manutenção
  @allure.severity.normal
  Cenário: [ADMIN] Cancela manutenção com status REQUESTED — retorna ativo como AVAILABLE
    Verifica que uma manutenção que ainda não foi iniciada pode ser cancelada.
    Ao cancelar, o ativo deve retornar ao status AVAILABLE, ficando disponível
    para novas atribuições ou solicitações.
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para cancelar"
    Quando cancelo a manutenção salva
    Então a resposta deve ter status 200
    E o status da manutenção deve ser "CANCELLED"
    E o ativo "ASSET-001" deve ter status "AVAILABLE"

  @cancelar @regra-negocio
  @allure.label.suite:Regras de Negócio
  @allure.severity.normal
  Cenário: [Regra de Negócio] Manutenção com status COMPLETED não pode ser cancelada — retorna 400
    Verifica que manutenções já concluídas não podem ser canceladas retroativamente.
    Isso preserva a integridade do histórico de manutenções e dos registros de custo
    associados à conclusão do serviço.
    Dado que estou autenticado como "admin@acme.com" com senha "Senha@123"
    E que criei uma manutenção para o ativo "ASSET-001" com descrição "Manutenção para concluir"
    E que iniciei essa manutenção
    E que concluí essa manutenção com resolução "Resolução válida aqui"
    Quando cancelo a manutenção salva
    Então a resposta deve ter status 400
    E a mensagem de erro deve conter "concluída"

  # =========================================================
  # SCENARIO OUTLINE — controle de acesso por perfil
  # =========================================================

  @autorizacao
  @allure.label.suite:Controle de Acesso
  @allure.severity.critical
  Esquema do Cenário: [Controle de Acesso] Apenas ADMIN e GESTOR podem solicitar manutenção
    Valida a matriz de permissões para criação de manutenção com três perfis distintos.
    ADMIN e GESTOR devem receber 201; OPERADOR deve receber 403.
    Dado que estou autenticado como "<email>" com senha "Senha@123"
    Quando solicito manutenção para o ativo "ASSET-001" com descrição "Teclado com teclas travadas"
    Então a resposta deve ter status <status_esperado>

    Exemplos:
      | email               | status_esperado |
      | admin@acme.com      | 201             |
      | gestor@acme.com     | 201             |
      | operador@acme.com   | 403             |
