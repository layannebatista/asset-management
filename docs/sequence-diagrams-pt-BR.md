# 1. Visão Geral

Este documento descreve os fluxos de sequência das principais operações no Sistema de Gestão de Ativos Enterprise.

Os diagramas de sequência ilustram a interação entre os componentes do sistema.

Componentes envolvidos:

- Cliente
- Camada de API
- Camada de Segurança
- Serviços da Aplicação
- Camada de Persistência
- Banco de Dados

---

# 2. Fluxo de Autenticação

Sequência:

Cliente → API: Requisição de login

API → Serviço de Autenticação: Validar credenciais

Serviço de Autenticação → Banco de Dados: Buscar usuário

Banco de Dados → Serviço de Autenticação: Retornar usuário

Serviço de Autenticação → API: Gerar token JWT

API → Cliente: Retornar token

---

# 3. Fluxo de Criação de Ativo

Sequência:

Cliente → API: Requisição de criação de ativo

API → Camada de Segurança: Validar token JWT

Camada de Segurança → API: Autenticação confirmada

API → Asset Service: Validar requisição

Asset Service → Banco de Dados: Inserir ativo

Banco de Dados → Asset Service: Retornar resultado

Asset Service → Audit Service: Registrar log de auditoria

Audit Service → Banco de Dados: Armazenar log de auditoria

Asset Service → API: Resposta de sucesso

API → Cliente: Ativo criado

---

# 4. Fluxo de Consulta de Ativo

Sequência:

Cliente → API: Solicitar ativo

API → Camada de Segurança: Validar JWT

Camada de Segurança → API: Autorizado

API → Asset Service: Buscar ativo

Asset Service → Banco de Dados: Consultar ativo

Banco de Dados → Asset Service: Retornar ativo

Asset Service → API: Retornar dados

API → Cliente: Resposta do ativo

---

# 5. Fluxo de Transferência

Sequência:

Cliente → API: Criar requisição de transferência

API → Camada de Segurança: Validar autenticação

API → Transfer Service: Validar transferência

Transfer Service → Banco de Dados: Armazenar transferência

Transfer Service → Audit Service: Registrar transferência

Audit Service → Banco de Dados: Armazenar log

Transfer Service → API: Transferência criada

API → Cliente: Resposta de sucesso

Aprovação da transferência:

Aprovador → API: Aprovar transferência

API → Camada de Segurança: Validar autorização

API → Transfer Service: Executar transferência

Transfer Service → Banco de Dados: Atualizar unidade do ativo

Transfer Service → Audit Service: Registrar execução da transferência

Audit Service → Banco de Dados: Armazenar log

API → Cliente: Transferência concluída

---

# 6. Fluxo de Inventário

Sequência:

Cliente → API: Iniciar inventário

API → Camada de Segurança: Validar JWT

API → Inventory Service: Iniciar inventário

Inventory Service → Banco de Dados: Armazenar registro de inventário

Inventory Service → Audit Service: Registrar inventário

API → Cliente: Inventário iniciado

---

# 7. Fluxo de Manutenção

Sequência:

Cliente → API: Criar requisição de manutenção

API → Camada de Segurança: Validar JWT

API → Maintenance Service: Criar requisição

Maintenance Service → Banco de Dados: Armazenar manutenção

Maintenance Service → Audit Service: Registrar manutenção

API → Cliente: Manutenção criada

---

# 8. Fluxo de Autorização

Sequência:

Cliente → API: Solicitar recurso

API → Camada de Segurança: Validar JWT

Camada de Segurança → Serviço de Autorização: Validar permissões

Serviço de Autorização → API: Resultado da autorização

API → Cliente: Permitir ou negar requisição

---

# 9. Fluxo de Registro de Auditoria

Sequência:

Service → Audit Service: Registrar operação

Audit Service → Banco de Dados: Armazenar log de auditoria

Audit Service → Service: Confirmar log armazenado

---

# 10. Fluxo de Tratamento de Erros

Sequência:

Cliente → API: Requisição

API → Service: Processar requisição

Service → API: Erro de validação

API → Cliente: Resposta de erro

---

# 11. Resumo

Estes fluxos de sequência demonstram:

- Processo de autenticação
- Validação de autorização
- Operações do ciclo de vida de ativos
- Operações de transferência
- Fluxos de inventário e manutenção
- Registro de auditoria

Esses fluxos garantem segurança, rastreabilidade e operação adequada.
