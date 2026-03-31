import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import fs = require('fs');
import path = require('path');

const REPORTS_DIR = path.resolve(__dirname, '../reports');
const SCREENSHOTS_DIR = path.resolve(REPORTS_DIR, 'screenshots');

BeforeAll(async function () {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

Before(async function (this: CustomWorld) {
  await this.init();
});

After(async function (this: CustomWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    const scenarioName = scenario.pickle.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${scenarioName}_${Date.now()}.png`);

    if (this.page) {
      const screenshot = await this.page.screenshot({ fullPage: true });
      fs.writeFileSync(screenshotPath, screenshot);
      this.attach(screenshot, 'image/png');
    }
  }

  await this.destroy();
});

AfterAll(async function () {
  // Nada a fazer globalmente; recursos são liberados no After por cenário
});
