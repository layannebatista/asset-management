# Guia de Deploy

Gerado em: 2026-02-18 02:27:47.030946

---

# 1. Visão Geral

Este documento descreve como realizar o deploy do Sistema de Gestão de Ativos Enterprise nos ambientes de desenvolvimento, homologação (staging) e produção.

O sistema é uma aplicação Spring Boot que utiliza PostgreSQL como banco de dados.

---

# 2. Requisitos do Sistema

Requisitos mínimos:

Servidor da aplicação:

- Java 17 ou superior
- Mínimo de 2 núcleos de CPU
- 4 GB de RAM recomendados

Servidor de banco de dados:

- PostgreSQL 13 ou superior
- Mínimo de 2 núcleos de CPU
- 4 GB de RAM recomendados

---

# 3. Software Necessário

Aplicação:

- Java 17+
- Maven 3.8+

Banco de dados:

- PostgreSQL

Componentes opcionais para produção:

- NGINX (reverse proxy)
- Load balancer
- Certificado SSL

---

# 4. Variáveis de Ambiente

Variáveis de ambiente obrigatórias:

SPRING_DATASOURCE_URL=jdbc:postgresql://host:port/database

SPRING_DATASOURCE_USERNAME=database_user

SPRING_DATASOURCE_PASSWORD=database_password

JWT_SECRET=secure_jwt_secret

Variáveis opcionais:

SPRING_PROFILES_ACTIVE=prod

SERVER_PORT=8080

---

# 5. Configuração do Banco de Dados

Etapas:

1. Instalar o PostgreSQL

2. Criar o banco de dados:

CREATE DATABASE asset_management;

3. Criar o usuário do banco de dados

4. Configurar as variáveis de conexão

5. Executar as migrações utilizando Flyway (automático na inicialização)

---

# 6. Build da Aplicação

Executar:

mvn clean package

Isso gera:

target/asset-management.jar

---

# 7. Executar a Aplicação

Executar localmente:

mvn spring-boot:run

Executar o JAR:

java -jar target/asset-management.jar

---

# 8. Verificar o Deploy

Verificar:

Aplicação em execução:

http://localhost:8080

Swagger UI:

http://localhost:8080/swagger-ui.html

---

# 9. Arquitetura de Deploy em Produção

Arquitetura recomendada:

Cliente
↓
HTTPS
↓
Reverse Proxy (NGINX)
↓
Aplicação Spring Boot
↓
Banco de Dados PostgreSQL

Opcional:

Load balancer
Múltiplas instâncias da aplicação

---

# 10. Configuração de Reverse Proxy (Recomendado)

O NGINX fornece:

- Terminação HTTPS
- Proteção de segurança
- Balanceamento de carga
- Roteamento de requisições

---

# 11. Requisitos de Segurança

Requisitos de segurança para produção:

- HTTPS deve estar habilitado
- O segredo JWT deve ser seguro
- O banco de dados não deve estar exposto publicamente
- As variáveis de ambiente devem ser protegidas

---

# 12. Logs

Logs da aplicação:

Logging do Spring Boot habilitado

Os logs devem ser armazenados de forma segura.

Recomendações para produção:

- Logging centralizado
- Monitoramento de logs

---

# 13. Monitoramento

Monitoramento recomendado:

- Monitoramento de saúde da aplicação
- Monitoramento do banco de dados
- Monitoramento de recursos

O Spring Boot Actuator pode ser utilizado.

---

# 14. Integração com Backup

Os backups do banco de dados devem estar habilitados.

Estratégia de backup:

- Backups diários
- Backups incrementais

Ver backup-recovery.md

---

# 15. Escalabilidade

Opções de escalabilidade:

Escalabilidade horizontal:

- Múltiplas instâncias da aplicação
- Load balancer

Escalabilidade vertical:

- Aumento de CPU e memória

A arquitetura stateless suporta escalabilidade.

---

# 16. Ambientes de Deploy

Ambientes recomendados:

Desenvolvimento
Homologação (Staging)
Produção

Cada ambiente deve possuir configuração separada.

---

# 17. Recuperação de Falhas

Etapas de recuperação:

1. Identificar a falha
2. Reiniciar a aplicação
3. Restaurar o banco de dados se necessário

Ver backup-recovery.md

---

# 18. Resumo

Esta estratégia de deploy garante:

- Deploy seguro
- Arquitetura escalável
- Operação confiável
- Prontidão para deploy nível enterprise
