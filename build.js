import * as esbuild from 'esbuild';
import { ESLint } from 'eslint';
import { cpSync, copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const isDev = process.argv.includes('--dev') || process.argv.includes('--watch');
const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: {
    'background': 'src/background.ts',
    'popup/popup': 'src/popup/popup.ts',
    'content/all-fields': 'src/content/all-fields.ts',
    'content/option-sets': 'src/content/option-sets.ts',
    'content/show-hidden-fields': 'src/content/show-hidden-fields.ts',
    'content/ribbon-toolbar': 'src/content/ribbon-toolbar.ts',
  },
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  target: 'chrome120',
  sourcemap: isDev ? 'inline' : false,
  minify: !isDev,
  logLevel: 'info',
};

function copyStatics() {
  mkdirSync('dist/popup', { recursive: true });
  mkdirSync('dist/content', { recursive: true });
  cpSync('icons', 'dist/icons', { recursive: true });
  generateManifest();
  copyFileSync('src/popup/popup.html', 'dist/popup/popup.html');
  copyFileSync('src/popup/popup.css', 'dist/popup/popup.css');
  copyFileSync('src/content/option-sets.css', 'dist/content/option-sets.css');
  copyFileSync('src/content/show-hidden-fields.css', 'dist/content/show-hidden-fields.css');
}

/** Merge manifest.json with crm.config.json (if present) and write to dist/manifest.json. */
function generateManifest() {
  const base = JSON.parse(readFileSync('manifest.json', 'utf8'));
  if (existsSync('crm.config.json')) {
    const local = JSON.parse(readFileSync('crm.config.json', 'utf8'));
    if (local.content_scripts) base.content_scripts = local.content_scripts;
    console.log('crm.config.json loaded — content_scripts injected into dist/manifest.json');
  } else {
    console.log('crm.config.json not found — building without content_scripts (copy crm.config.example.json to configure)');
  }
  writeFileSync('dist/manifest.json', JSON.stringify(base, null, 2));
}

/** Run ESLint over src/ and print any findings. */
async function runLint() {
  const eslint = new ESLint();
  const results = await eslint.lintFiles(['src/']);
  const formatter = await eslint.loadFormatter('stylish');
  const output = String(await formatter.format(results));
  if (output) console.log(output);
  const errorCount = results.reduce((n, r) => n + r.errorCount, 0);
  if (errorCount === 0) console.log('ESLint: no errors');
}

if (isWatch) {
  const ctx = await esbuild.context({
    ...options,
    plugins: [{
      name: 'watch-extras',
      setup(build) {
        build.onEnd(async (result) => {
          copyStatics();
          if (result.errors.length === 0) await runLint();
        });
      },
    }],
  });
  copyStatics();
  await ctx.watch();
  console.log('Watching for changes — ESLint runs after each rebuild…');
} else {
  await esbuild.build(options);
  copyStatics();
  await runLint();
  console.log('Build complete → dist/');
}
