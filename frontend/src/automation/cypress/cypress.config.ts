import { defineConfig } from 'cypress';
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild';
import createBundler from '@bahmutov/cypress-esbuild-preprocessor';
import { allureCypress } from 'allure-cypress/reporter';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'e2e/features/**/*.feature',
    supportFile: 'support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    async setupNodeEvents(on, config) {
      // Allure reporter — grava JSONs em backend/allure-results (mesmo diretório montado pelo container)
      // Caminho relativo à raiz do projeto Cypress (frontend/src/automation/cypress/)
      // Sobe 4 níveis → raiz do projeto → entra em backend/allure-results
      // Os testes Frontend ficam identificados pela label @allure.label.parentSuite:Frontend
      allureCypress(on, {
        resultsDir: '../../../../backend/allure-results',
      });

      await addCucumberPreprocessorPlugin(on, config);
      on(
        'file:preprocessor',
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        })
      );
      return config;
    },
  },
  env: {
    ADMIN_EMAIL: 'admin@empresa.com',
    ADMIN_PASSWORD: 'Admin@123',
    GESTOR_EMAIL: 'gestor@empresa.com',
    GESTOR_PASSWORD: 'Gestor@123',
    OPERADOR_EMAIL: 'operador@empresa.com',
    OPERADOR_PASSWORD: 'Op@12345',
    API_URL: 'http://localhost:8080',
    // Labels padrão do Allure para todos os testes E2E
    allure: true,
  },
});
