# =============================================================================
# Runner de testes E2E Playwright + Cucumber BDD
# Contexto de build: ./frontend/src/automation/playwright
# Os resultados Allure são escritos em /allure-results (via ALLURE_RESULTS_DIR)
# =============================================================================
FROM node:20.19-bookworm

WORKDIR /app

# ✅ Otimizações de memória e performance
ENV NODE_OPTIONS="--max-old-space-size=2048 --max-http-header-size=16384"
ENV NODE_ENV=development
ENV PWHEADLESS=true
ENV ALLURE_RESULTS_DIR=/allure-results

# Aumenta limites de arquivo e memória
RUN echo "fs.file-max=2097152" >> /etc/sysctl.conf && \
    echo "* soft nofile 65536" >> /etc/security/limits.conf && \
    echo "* hard nofile 65536" >> /etc/security/limits.conf

# Instala dependências Node (postinstall já baixa o Chromium)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Instala dependências de sistema necessárias para o Chromium
RUN npx playwright install-deps chromium

# Limpeza de cache para reduzir tamanho da imagem
RUN npm cache clean --force && \
    apt-get update && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Copia apenas os arquivos de teste (node_modules já instalado acima)
COPY cucumber.js tsconfig.json ./
COPY features ./features
COPY step-definitions ./step-definitions
COPY support ./support

# Criar diretório para resultados
RUN mkdir -p /allure-results /app/reports/screenshots

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=2 \
  CMD test -f /app/cucumber.js || exit 1

CMD ["npm", "test"]
