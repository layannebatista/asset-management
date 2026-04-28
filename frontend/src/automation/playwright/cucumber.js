const path = require('path');

const allureResultsDir = process.env.ALLURE_RESULTS_DIR
  || path.resolve(__dirname, '../../../../allure-results');

module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: [
      'support/world.ts',
      'support/hooks.ts',
      'step-definitions/**/*.ts',
    ],
    requireModule: ['ts-node/register'],
    format: [
      'summary',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
      `allure-cucumberjs/reporter`,
    ],
    formatOptions: {
      snippetInterface: 'async-await',
      resultsDir: allureResultsDir,
    },
    worldParameters: {
      baseUrl: process.env.BASE_URL || 'http://localhost:5173',
      headless: process.env.PWHEADLESS !== 'false',
    },
    // ✅ Aumenta timeouts para evitar SIGTERM
    timeout: 120000, // 2 minutos por step
    dryRun: false,
    failFast: false,
    parallel: 1, // 1 cenário por vez para economizar memória
    retryTagFilter: '@flaky', // Retry apenas testes marcados como flaky
  },
};
