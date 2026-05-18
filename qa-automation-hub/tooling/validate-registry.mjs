import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hubRoot = join(__dirname, '..');
const registryPath = join(__dirname, 'projects.registry.json');
const raw = JSON.parse(readFileSync(registryPath, 'utf8'));

const monoRoot = resolve(process.env.PHANTASM_MONO_ROOT || join(hubRoot, '..'));

const playwrightConfigNames = [
  'playwright.config.ts',
  'playwright.config.js',
  'playwright.config.mjs',
  'playwright.config.cjs',
];

function hasPlaywrightConfig(dir) {
  return playwrightConfigNames.some((name) => existsSync(join(dir, name)));
}

let errors = 0;
for (const p of raw.projects) {
  const dir = resolve(monoRoot, p.repoPath);
  if (!existsSync(dir)) {
    console.error(`Missing project path: ${p.repoPath} -> ${dir} (${p.id})`);
    errors++;
  }
  if (!existsSync(join(dir, 'package.json'))) {
    console.error(`Missing package.json under: ${dir} (${p.id})`);
    errors++;
  } else if (!hasPlaywrightConfig(dir)) {
    console.error(
      `Missing playwright.config.{ts,js,mjs,cjs} under: ${dir} (${p.id})`,
    );
    errors++;
  }
}
if (errors) process.exit(1);
console.log('Registry OK:', raw.projects.length, 'project(s)');
console.log('PHANTASM_MONO_ROOT:', monoRoot);
