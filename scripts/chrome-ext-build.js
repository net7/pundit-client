/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const { version } = require('../package.json');

const stageVersionFilePath = path.join(path.dirname(fs.realpathSync(__filename)), '../scripts/.stage.version');

const getStageVersion = () => {
  let newStageVersion = null;
  try {
    const fileData = fs.readFileSync(stageVersionFilePath, 'utf8');
    const fileLines = fileData.split(/\r?\n/);
    if (Array.isArray(fileLines) && fileLines.length) {
      const firstLine = fileLines[0].trim();
      const [pkgMajor, pkgMinor, pkgPatch] = version.split('.');
      const [major, minor, patch, extra] = firstLine.split('.');
      let newExtra;
      if (
        (pkgMajor !== major)
        || (pkgMinor !== minor)
        || (pkgPatch !== patch)
      ) {
        newExtra = 0;
      } else {
        newExtra = +extra + 1;
      }
      newStageVersion = [pkgMajor, pkgMinor, pkgPatch, newExtra].join('.');
      // update stage file with new version
      fs.writeFileSync(stageVersionFilePath, newStageVersion);
    } else {
      throw Error(`File ${stageVersionFilePath} empty`);
    }
  } catch (err) {
    console.log(err);
  }

  return newStageVersion;
};

const copyChromeExtFiles = (dist, src) => fs.copy(src, dist).catch((err) => {
  console.log('copy chrome ext files error:', err);
  throw new Error('copy chrome ext files fail');
});

const createManifestFile = (dist, context) => {
  const basePath = path.join(path.dirname(fs.realpathSync(__filename)), '../src/chrome-ext');
  const manifestCommonPath = `${basePath}/manifest.json`;
  const manifestContextPath = context === 'chrome-ext-stage'
    ? `${basePath}/manifest.stage.json`
    : `${basePath}/manifest.prod.json`;
  const manifestCommon = require(manifestCommonPath);
  const manifestContext = require(manifestContextPath);
  const manifestData = _.merge(manifestCommon, manifestContext);
  // update with lib version
  manifestData.version = context === 'chrome-ext-stage'
    ? getStageVersion()
    : version;
  return fs.writeJson(`${dist}/manifest.json`, manifestData);
};

const buildExt = (context, dist) => {
  const src = path.join(path.dirname(fs.realpathSync(__filename)), '../dist/chrome-ext-tmp/');
  // init
  copyChromeExtFiles(dist, src)
    .then(() => createManifestFile(dist, context))
    .then(() => fs.remove(src))
    .then(() => {
      console.log('Chrome extension files updated');
    })
    .catch((error) => {
      console.log(error);
    });
};

module.exports = { buildExt };
