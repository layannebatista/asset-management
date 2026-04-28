#!/usr/bin/env bash
# Limpa os resultados antigos do Allure, preservando apenas o histórico de tendências.
# Execute este script antes de rodar os testes ou subir o sistema para garantir
# que o Allure exiba apenas os resultados da execução mais recente.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RESULTS_DIR="$ROOT_DIR/allure-results"
PLAYWRIGHT_REPORTS_DIR="$ROOT_DIR/frontend/src/automation/playwright/reports"

echo "Limpando resultados antigos em: $RESULTS_DIR"

if [ ! -d "$RESULTS_DIR" ]; then
  echo "Diretório não encontrado: $RESULTS_DIR"
  exit 1
fi

# Remove arquivos de resultado (JSON, PNG, etc.) mas preserva a pasta history/
# executor.json é gerado pelo allure-docker-service e também deve ser removido
find "$RESULTS_DIR" -maxdepth 1 -type f \
  \( -name "*.json" -o -name "*.png" -o -name "*.csv" \
     -o -name "*.xml" -o -name "*.txt" -o -name "*.properties" \
     -o -name "*.mp4" -o -name "*.webm" \) \
  -delete

if [ -d "$PLAYWRIGHT_REPORTS_DIR" ]; then
  echo "Limpando relatórios HTML/JSON antigos do Playwright em: $PLAYWRIGHT_REPORTS_DIR"
  find "$PLAYWRIGHT_REPORTS_DIR" -maxdepth 1 -type f \
    \( -name "*.json" -o -name "*.html" \) \
    -delete
fi

echo "Limpeza concluída. Histórico de tendências preservado em: $RESULTS_DIR/history"
