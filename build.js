import * as esbuild from 'esbuild';
import { cpSync, copyFileSync, mkdirSync } from 'node:fs';

const isDev = process.argv.includes('--dev') || process.argv.includes('--watch');
const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: {
    'background': 'src/background.ts',
    'popup/popup': 'src/popup/popup.ts',
    'content/all-fields': 'src/content/all-fields/all-fields.ts',
    'content/option-sets': 'src/content/option-sets/option-sets.ts',
    'content/show-hidden-fields': 'src/content/show-hidden-fields/show-hidden-fields.ts',
    'content/dirty-fields': 'src/content/dirty-fields/dirty-fields.ts',
    'content/open-on-api':  'src/content/open-on-api/open-on-api.ts',
    'content/open-newest-modified': 'src/content/open-newest-modified/open-newest-modified.ts',
    'content/activate-activity': 'src/content/activate-activity/activate-activity.ts',
    'content/prefetch-entities': 'src/content/prefetch-entities/prefetch-entities.ts',
    'content/ribbon-toolbar': 'src/ribbon/ribbon-toolbar/ribbon-toolbar.ts',
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
  copyFileSync('manifest.json', 'dist/manifest.json');
  copyFileSync('src/popup/popup.html', 'dist/popup/popup.html');
  copyFileSync('src/popup/popup.css', 'dist/popup/popup.css');
  copyFileSync('src/content/option-sets/option-sets.css', 'dist/content/option-sets.css');
  copyFileSync('src/content/all-fields/all-fields.css', 'dist/content/all-fields.css');
  copyFileSync('src/content/show-hidden-fields/show-hidden-fields.css', 'dist/content/show-hidden-fields.css');
  copyFileSync('src/content/dirty-fields/dirty-fields.css', 'dist/content/dirty-fields.css');
  copyFileSync('src/content/open-newest-modified/open-newest-modified.css', 'dist/content/open-newest-modified.css');
}

if (isWatch) {
  const ctx = await esbuild.context({
    ...options,
    plugins: [{
      name: 'watch-extras',
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length === 0) copyStatics();
        });
      },
    }],
  });
  copyStatics();
  await ctx.watch();
  console.log('Watching for changes…');
} else {
  await esbuild.build(options);
  copyStatics();
  console.log('Build complete → dist/');
}
