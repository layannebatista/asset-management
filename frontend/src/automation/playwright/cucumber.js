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
    timeout: 40000, // 40 segundos por step (balance entre speed e confiabilidade)
    dryRun: false,
    failFast: false,
    parallel: 2, // 2 cenários simultâneos (rate limit de login: ~10 req/min)
    retry: 1, // Retry uma vez para testes @flaky
    retryTagFilter: '@flaky', // Retry apenas testes marcados como flaky
  },
};
