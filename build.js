import * as esbuild from 'esbuild';
import { ESLint } from 'eslint';
import { cpSync, copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const isDev = process.argv.includes('--dev') || process.argv.includes('--watch');
const isWatch = process.argv.includes('--watch');

/** Read and parse crm.config.json, returning the parsed object or null if absent. */
function readCrmConfig() {
  if (!existsSync('crm.config.json')) return null;
  return JSON.parse(readFileSync('crm.config.json', 'utf8'));
}

/** Validate and return the urls[] array from crm.config.json for use in esbuild define.
 *  Watch mode requires a process restart to pick up config changes — same as today. */
function loadCrmUrls() {
  const cfg = readCrmConfig();
  if (!cfg || !Array.isArray(cfg.urls)) return [];
  for (const url of cfg.urls) {
    try { new URL(url); }
    catch { throw new Error(`crm.config.json: invalid URL in urls[]: "${url}"`); }
  }
  return cfg.urls;
}

const crmUrls = loadCrmUrls();

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
  define: {
    // Injected into ribbon-toolbar.ts at build time for runtime case-insensitive URL matching.
    __CRM_URLS__: JSON.stringify(crmUrls),
  },
};

function copyStatics() {
  mkdirSync('dist/popup', { recursive: true });
  mkdirSync('dist/content', { recursive: true });
  cpSync('icons', 'dist/icons', { recursive: true });
  generateManifest();
  copyFileSync('src/popup/popup.html', 'dist/popup/popup.html');
  copyFileSync('src/popup/popup.css', 'dist/popup/popup.css');
  copyFileSync('src/content/option-sets.css', 'dist/content/option-sets.css');
  copyFileSync('src/content/all-fields.css', 'dist/content/all-fields.css');
  copyFileSync('src/content/show-hidden-fields.css', 'dist/content/show-hidden-fields.css');
}

/** Build a broad Chrome match pattern (hostname only) from a validated URL.
 *  Path filtering is handled at runtime in ribbon-toolbar.ts for case-insensitive matching. */
function hostPattern(url) {
  return `*://${new URL(url).hostname}/*`;
}

/** Normalize a Chrome extension URL match pattern to lowercase (after the scheme).
 *  Used only for the legacy content_scripts config format. */
function normalizeMatchPattern(pattern) {
  const schemeEnd = pattern.indexOf('://');
  if (schemeEnd === -1) return pattern;
  return pattern.slice(0, schemeEnd + 3) + pattern.slice(schemeEnd + 3).toLowerCase();
}

/** Re-reads crm.config.json on every call so watch-mode manifests stay fresh. */
function generateManifest() {
  const base = JSON.parse(readFileSync('manifest.json', 'utf8'));
  const local = readCrmConfig();

  if (!local) {
    console.log('crm.config.json not found — building without content_scripts (copy crm.config.example.json to configure)');
    writeFileSync('dist/manifest.json', JSON.stringify(base, null, 2));
    return;
  }

  const hasUrls   = Array.isArray(local.urls)            && local.urls.length > 0;
  const hasLegacy = Array.isArray(local.content_scripts) && local.content_scripts.length > 0;

  if (hasUrls && hasLegacy) {
    console.warn('crm.config.json warning: both "urls" and "content_scripts" present — "urls" takes precedence. Remove "content_scripts" to silence this warning.');
  }

  if (hasUrls) {
    for (const url of local.urls) {
      try { new URL(url); }
      catch { throw new Error(`crm.config.json: invalid URL in urls[]: "${url}"`); }
    }
    const patterns = [...new Set(local.urls.map(hostPattern))];
    base.content_scripts = [{
      matches: patterns,
      js: ['content/ribbon-toolbar.js'],
      run_at: 'document_idle',
      all_frames: false,
    }];
    console.log(`crm.config.json loaded — ${local.urls.length} URL(s), ${patterns.length} host pattern(s)`);
  } else if (hasLegacy) {
    console.warn('crm.config.json: "content_scripts" format is deprecated — migrate to "urls" array for case-insensitive matching.');
    base.content_scripts = local.content_scripts.map(script => ({
      ...script,
      matches: script.matches?.map(normalizeMatchPattern) ?? script.matches,
    }));
    console.log('crm.config.json loaded (legacy) — content_scripts injected into dist/manifest.json');
  } else {
    console.log('crm.config.json found but no urls or content_scripts configured');
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
