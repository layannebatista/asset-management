module.exports = {
  default: {
    paths: ['../shared/features/**/*.feature'],
    require: [
      'support/hooks.ts',
      'step-definitions/**/*.ts',
    ],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
    ],
    formatOptions: { snippetInterface: 'async-await' },
    worldParameters: {
      baseUrl: process.env.BASE_URL || 'http://localhost:5173',
      headless: process.env.PWHEADLESS !== 'false',
    },
  },
};
