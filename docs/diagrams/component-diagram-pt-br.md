# 1. Visão Geral

Este documento descreve a arquitetura em nível de componentes do Sistema de Gestão de Ativos Enterprise.

Ele define os principais componentes do sistema e suas interações.

O sistema segue uma arquitetura em camadas, modular e segura.

---

# 2. Estrutura de Componentes em Alto Nível

Componentes principais:

Camada Cliente  
↓  
Camada de API (Controllers Spring Boot)  
↓  
Camada de Segurança (Autenticação e Autorização)  
↓  
Camada de Aplicação (Serviços de Negócio)  
↓  
Camada de Domínio (Entidades e Lógica de Negócio)  
↓  
Camada de Persistência (Repositories)  
↓  
Camada de Banco de Dados (PostgreSQL)  

Cada componente possui uma responsabilidade definida.

---

# 3. Componente Cliente

Exemplos:

- Frontend web
- Aplicações mobile
- Clientes de API
- Integrações externas

Responsabilidades:

- Enviar requisições HTTP
- Fornecer token JWT
- Exibir respostas

O cliente não acessa o banco de dados diretamente.

---

# 4. Componente da Camada de API

Localização:

interfaces/rest/

Responsabilidades:

- Receber requisições HTTP
- Validar entrada
- Converter DTOs
- Chamar serviços
- Retornar respostas

Controllers não contêm lógica de negócio.

---

# 5. Componente de Segurança

Localização:

security/

Responsabilidades:

- Validar tokens JWT
- Autenticar usuários
- Autorizar acesso
- Aplicar isolamento multi-tenant

A camada de segurança intercepta todas as requisições recebidas.

Fluxo de segurança:

Requisição  
↓  
Filtro de Autenticação JWT  
↓  
Contexto de Segurança  
↓  
Validação de Autorização  

---

# 6. Componente da Camada de Aplicação

Localização:

application/

Responsabilidades:

- Implementar lógica de negócio
- Aplicar regras de negócio
- Coordenar operações
- Gerenciar transações

Serviços incluem:

- AssetService
- UserService
- TransferService
- InventoryService
- MaintenanceService

---

# 7. Componente da Camada de Domínio

Localização:

domain/

Responsabilidades:

- Definir entidades principais
- Representar conceitos de negócio
- Aplicar regras de domínio

Exemplos:

- Asset
- User
- Organization
- Unit
- Transfer
- InventoryCycle
- MaintenanceRequest
- AuditLog

A camada de domínio é independente da infraestrutura.

---

# 8. Componente da Camada de Persistência

Localização:

infrastructure/

Responsabilidades:

- Persistir entidades
- Consultar o banco de dados
- Abstrair operações de banco

Utiliza:

- JPA
- Hibernate
- Padrão Repository

---

# 9. Componente de Banco de Dados

Banco de dados:

PostgreSQL

Responsabilidades:

- Armazenar dados persistentes
- Aplicar constraints
- Manter integridade

Gerenciado utilizando:

- Migrações Flyway

---

# 10. Componente de Auditoria

Responsabilidades:

- Registrar atividades do sistema
- Fornecer rastreabilidade
- Suportar monitoramento de segurança

Os logs de auditoria incluem:

- Usuário
- Timestamp
- Operação
- Entidade afetada

Os dados de auditoria são imutáveis.

---

# 11. Fluxo de Interação entre Componentes

Fluxo típico de requisição:

Cliente  
↓  
Camada de Segurança  
↓  
Controller da API  
↓  
Service da Aplicação  
↓  
Repository  
↓  
Banco de Dados  

Fluxo de resposta:

Banco de Dados  
↓  
Repository  
↓  
Service  
↓  
Controller  
↓  
Cliente  

---

# 12. Integração de Segurança

A segurança está integrada em todos os componentes.

Os controles de segurança incluem:

- Validação de JWT
- Verificações de autorização
- Isolamento multi-tenant
- Registro de auditoria

---

# 13. Estrutura Modular

Módulos principais:

- Módulo de Autenticação
- Módulo de Organização
- Módulo de Unidade
- Módulo de Usuário
- Módulo de Ativo
- Módulo de Transferência
- Módulo de Inventário
- Módulo de Manutenção
- Módulo de Auditoria

Cada módulo segue o mesmo padrão em camadas.

---

# 14. Considerações de Escalabilidade

A arquitetura suporta:

- Escalabilidade horizontal
- Múltiplas instâncias da aplicação
- Balanceamento de carga

O design stateless permite escalabilidade.

---

# 15. Resumo

Esta arquitetura de componentes fornece:

- Separação clara de responsabilidades
- Controle de acesso seguro
- Estrutura manutenível
- Design escalável
- Robustez nível enterprise
