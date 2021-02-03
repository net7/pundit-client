/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */

const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs-extra');
const path = require('path');
const concat = require('concat');

const context = argv.c;
const distPath = path.join(path.dirname(fs.realpathSync(__filename)), '../dist');
const basePath = `${distPath}/${context}`;
const filesToMerge = ['main.js', 'styles.js'];
const outputFile = `pundit.${context}.js`;
const outputFilePath = `${basePath}/${outputFile}`;
let allowedFiles = [outputFile];

if (argv.c === 'chrome-ext') {
  allowedFiles = [
    ...allowedFiles,
    'assets',
    'pundit-icon',
    'background.js',
    'content.js',
    'manifest.json',
  ];
}

// merge in one file
concat(filesToMerge.map((file) => `${basePath}/${file}`), outputFilePath)
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
