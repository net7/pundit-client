const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs-extra');
const path = require('path');
const { buildExt } = require('./chrome-ext-build');

const context = argv.c;
const isChromeExt = ['chrome-ext-stage', 'chrome-ext-prod'].includes(context);
const distPath = path.join(path.dirname(fs.realpathSync(__filename)), '../dist');
const basePath = `${distPath}/${context}`;
// The native esbuild ('application') builder emits the polyfills and the app as
// separate self-contained bundles (webpack's --single-bundle used to fold them
// into one main.js). Concatenate them — polyfills first — then the style injector.
const jsBundles = ['polyfills.js', 'main.js'];
const outputFile = isChromeExt ? 'pundit.chrome-ext.js' : 'pundit.embed.js';
const outputFilePath = `${basePath}/${outputFile}`;
let allowedFiles = [outputFile];

// chrome extension check
if (['chrome-ext-stage', 'chrome-ext-prod'].includes(context)) {
  allowedFiles = [
    ...allowedFiles,
    'assets',
    'background.bundle.js',
    'content.bundle.js',
    'manifest.json',
    'pdf-viewer.html'
  ];
  buildExt(context, basePath);
}
// pdf standalone check
if (['pdf-standalone-stage', 'pdf-standalone-prod'].includes(context)) {
  allowedFiles = [
    ...allowedFiles,
    'assets',
    'pdf-viewer.html',
  ];
}

// create styles.js file
const createStylesJsFile = () => fs.readFile(`${basePath}/styles.css`, 'utf8')
  .then((data) => {
    const fileContent = `
        if (!document.getElementById("pundit-host-styles")) {
          const style = document.createElement("style");
          style.setAttribute("id", "pundit-host-styles");
          style.textContent = \`
            ${data}
          \`;
          document.head.appendChild(style);
        }
      `;
    return fs.writeFile(`${basePath}/styles.js`, fileContent);
  });

// Merge the esbuild bundles + style injector into the single embed file.
// Each esbuild bundle declares its own minified top-level vars, so wrap every
// bundle in its own IIFE to prevent global-scope collisions once concatenated
// (the file is loaded as a classic script, not an ES module).
const mergeIntoSingleFile = () => {
  const parts = jsBundles.map((file) => {
    const code = fs.readFileSync(`${basePath}/${file}`, 'utf8');
    return `;(function(){\n${code}\n})();`;
  });
  parts.push(fs.readFileSync(`${basePath}/styles.js`, 'utf8'));
  return fs.writeFile(outputFilePath, parts.join('\n'));
};

createStylesJsFile()
  // merge in one file
  .then(() => mergeIntoSingleFile())
  .then(() => {
    console.log(`Dist updated with merged file ${outputFile}`);
    return fs.readdir(basePath);
  })
  .then((files) => {
    const filesToRemove = files.filter((file) => !allowedFiles.includes(file));

    return Promise.all(
      filesToRemove.map((file) => fs.remove(`${basePath}/${file}`))
    );
  })
  .then(() => {
    console.log(`Clean up unused files on ${basePath}`);
  })
  .catch((e) => {
    console.error(`Build ${outputFile} error`, e);
  });
