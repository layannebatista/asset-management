import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const policies = [
  { file: 'ai-intelligence/package.json', minNode: 20, forbidViteBeta: false },
  { file: 'sprint-reporter/package.json', minNode: 20, forbidViteBeta: false },
  { file: 'frontend/package.json', minNode: 20, forbidViteBeta: true },
];

const errors = [];

for (const policy of policies) {
  const packagePath = path.join(root, policy.file);
  const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const nodeEngine = content?.engines?.node;

  if (!nodeEngine) {
    errors.push(`${policy.file}: engines.node ausente`);
  } else if (!nodeEngine.includes('20')) {
    errors.push(`${policy.file}: engines.node deve exigir Node 20+ (atual: ${nodeEngine})`);
  }

  if (policy.forbidViteBeta) {
    const viteVersion = content?.devDependencies?.vite ?? '';
    if (viteVersion.includes('beta')) {
      errors.push(`${policy.file}: vite beta nao permitido (atual: ${viteVersion})`);
    }
  }
}

if (errors.length > 0) {
  console.error('Falha na politica de runtime/toolchain:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Politica de runtime/toolchain validada com sucesso.');
