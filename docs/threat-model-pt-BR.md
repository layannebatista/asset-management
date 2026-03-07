# 1. Visão Geral

Este documento define o modelo de ameaças para o Sistema de Gestão de Ativos Enterprise.

O modelo de ameaças identifica ameaças potenciais, vetores de ataque e estratégias de mitigação.

Metodologia utilizada:

STRIDE

A modelagem de ameaças suporta:

- Design de segurança
- Gestão de riscos
- Requisitos de conformidade
- Prevenção de incidentes

---

# 2. Visão Geral do Sistema

O sistema é um backend Spring Boot multi-tenant com banco de dados PostgreSQL.

Componentes da arquitetura:

- Cliente
- Camada de API
- Camada de Segurança
- Camada de Aplicação
- Banco de Dados

Existem limites de confiança entre cada componente.

---

# 3. Ativos a Proteger

Ativos críticos:

- Tokens de autenticação JWT
- Credenciais de usuários
- Dados de ativos
- Dados de organizações
- Logs de auditoria
- Registros de manutenção e inventário

Ativos sensíveis:

- Dados pessoais (protegidos pela LGPD)
- Identificadores internos
- Dados de autorização

A proteção desses ativos é crítica.

---

# 4. Limites de Confiança

Existem limites de confiança entre:

Cliente ↔ API

API ↔ Camada de Segurança

API ↔ Camada de Aplicação

Camada de Aplicação ↔ Banco de Dados

Tenant ↔ Tenant

Banco de Dados ↔ Infraestrutura

Os limites de confiança exigem validação e controle de acesso.

---

# 5. Análise de Ameaças STRIDE

Categorias de ameaças:

Spoofing  
Tampering  
Repudiation  
Information Disclosure  
Denial of Service  
Elevation of Privilege  

---

## 5.1 Spoofing

Ameaça:

Atacante se passa por um usuário legítimo.

Vetores de ataque:

- Roubo de credenciais
- Roubo de token
- Autenticação fraca

Mitigação:

- Autenticação JWT
- Assinatura segura de token
- Hash de senha (BCrypt)
- Expiração de token

---

## 5.2 Tampering

Ameaça:

Modificação não autorizada de dados do sistema.

Vetores de ataque:

- Manipulação direta do banco de dados
- Uso indevido da API

Mitigação:

- Validação de autorização
- Validação no lado do servidor
- Logs de auditoria imutáveis

---

## 5.3 Repudiation

Ameaça:

Usuário nega ter realizado ações.

Mitigação:

- Registro de auditoria
- Registros com timestamp
- Registro de identificação do usuário

Os logs de auditoria garantem responsabilização.

---

## 5.4 Information Disclosure

Ameaça:

Acesso não autorizado a dados sensíveis.

Vetores de ataque:

- Acesso não autorizado à API
- Vazamento de dados

Mitigação:

- Aplicação de autenticação
- Aplicação de autorização
- Isolamento multi-tenant
- Criptografia HTTPS

---

## 5.5 Denial of Service

Ameaça:

Sobrecarga do sistema ou interrupção do serviço.

Vetores de ataque:

- Flood de requisições
- Exaustão de recursos

Mitigação:

- Rate limiting
- Proteção via reverse proxy
- Monitoramento

---

## 5.6 Elevation of Privilege

Ameaça:

Escalonamento de privilégio não autorizado.

Vetores de ataque:

- Bypass de autorização
- Manipulação de token

Mitigação:

- Validação de role
- Verificações de autorização
- Validação segura de token

---

# 6. Ameaças Multi-Tenant

Ameaça crítica:

Acesso a dados entre tenants

Mitigação:

- Filtragem por organizationId
- Aplicação de autorização
- Validação de tenant

O isolamento multi-tenant é crítico.

---

# 7. Ameaças de Infraestrutura

Ameaças:

- Comprometimento do banco de dados
- Comprometimento do servidor
- Vazamento de segredos

Mitigação:

- Armazenamento seguro de segredos
- Acesso restrito ao banco de dados
- Hardening de infraestrutura

---

# 8. Ameaças de Aplicação

Ameaças:

- Ataques de injeção
- Acesso não autorizado à API

Mitigação:

- Validação de entrada
- Autenticação
- Autorização

---

# 9. Proteção de Dados

Proteção de dados sensíveis:

Senhas:

- Hash BCrypt

Tokens de autenticação:

- Tokens JWT assinados

Transmissão:

- Criptografia HTTPS

---

# 10. Superfície de Ataque

Superfícies de ataque incluem:

- Endpoints da API
- Endpoints de autenticação
- Acesso ao banco de dados
- Infraestrutura

As superfícies de ataque devem ser protegidas.

---

# 11. Risco Residual

Riscos residuais incluem:

- Ameaça interna
- Má configuração de infraestrutura

Mitigação:

- Monitoramento
- Logging
- Controles de acesso

---

# 12. Resumo dos Controles de Segurança

Controles de segurança:

- Autenticação JWT
- Autorização baseada em roles
- Isolamento multi-tenant
- Registro de auditoria
- Armazenamento seguro de dados

---

# 13. Recomendações de Segurança

Obrigatório:

- HTTPS em produção
- Gerenciamento seguro de segredos
- Acesso restrito ao banco de dados

Recomendado:

- Rate limiting
- Detecção de intrusão
- Monitoramento

---

# 14. Resumo

Este modelo de ameaças garante:

- Identificação de ameaças do sistema
- Mitigação de riscos
- Postura de segurança nível enterprise
