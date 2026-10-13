const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const { version } = require('../package.json');

const stageVersionFilePath = path.join(path.dirname(fs.realpathSync(__filename)), '../scripts/.stage.version');

// Read-only: the stage version is bumped by the stage release
// (scripts/deploy.js), never by a build.
const readStageVersion = () => {
  const firstLine = fs.readFileSync(stageVersionFilePath, 'utf8').split(/\r?\n/)[0].trim();
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(firstLine)) {
    throw new Error(`Invalid stage version "${firstLine}" in ${stageVersionFilePath}`);
  }
  return firstLine;
};

const copyChromeExtFiles = (dist, src) => fs.copy(src, dist).catch((err) => {
  console.log('copy chrome ext files error:', err);
  throw new Error('copy chrome ext files fail');
});

const copyEmbedBuildFile = (dist, context) => {
  const embedDirName = context.replace('chrome-ext', 'embed');
  const fileSrc = path.join(path.dirname(fs.realpathSync(__filename)), `../dist/${embedDirName}/pundit.embed.js`);
  const fileDist = `${dist}/pundit.embed.js`;
  return fs.copy(fileSrc, fileDist).catch((err) => {
    console.log('copy embed build file error:', err);
    throw new Error('copy embed build file fail');
  });
};

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
    ? readStageVersion()
    : version;
  return fs.writeJson(`${dist}/manifest.json`, manifestData);
};

const buildExt = (context, dist) => {
  const src = path.join(path.dirname(fs.realpathSync(__filename)), '../dist/chrome-ext-tmp/');
  // init
  copyChromeExtFiles(dist, src)
    .then(() => copyEmbedBuildFile(dist, context))
    .then(() => createManifestFile(dist, context))
    .then(() => fs.remove(src))
    .then(() => {
      console.log('Chrome extension files updated');
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
};

module.exports = { buildExt };
