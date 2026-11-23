// Per-environment release settings.

const DISTRIBUTION_ID = 'E3JMMV8C3EZFVD';
const DEFAULT_AWS_REGION = 'eu-south-1';

const ENVIRONMENTS = {
  stage: {
    s3Prefix: 's3://static-pundit/releases/stage',
    invalidationPath: '/releases/stage/*',
    // the BE API lives on the application's host, under /api
    apiHost: 'app.thepund.netseven.work',
    // the other environment and the retired annotation server
    forbiddenApiHosts: ['app.thepund.it', 'api.thepund.it', 'api.thepund.netseven.work'],
    // path -> required? (chrome-ext-urls.stage.js is optional: webpack falls back to the netseven defaults)
    envFiles: {
      'src/environments/local.stage.ts': true,
      'src/environments/chrome-ext-urls.stage.js': false,
    },
    extensionIdVar: 'CWS_EXTENSION_ID_STAGE',
    versionFiles: ['scripts/.stage.version'],
    buildScript: 'build:chrome-ext-stage',
    extDist: 'dist/chrome-ext-stage',
    embedDist: 'dist/embed-stage',
    // no tag: stage releases are recorded by their commit only
    commitMessage: (v) => `chore(release): stage ${v}`,
  },
  prod: {
    s3Prefix: 's3://static-pundit/releases',
    invalidationPath: '/releases/*',
    apiHost: 'app.thepund.it',
    forbiddenApiHosts: ['app.thepund.netseven.work', 'api.thepund.netseven.work', 'api.thepund.it'],
    envFiles: {
      'src/environments/local.prod.ts': true,
    },
    extensionIdVar: 'CWS_EXTENSION_ID_PROD',
    versionFiles: ['package.json', 'package-lock.json'],
    buildScript: 'build:chrome-ext-prod',
    extDist: 'dist/chrome-ext-prod',
    embedDist: 'dist/embed-prod',
    tag: (v) => `v${v}`,
    commitMessage: (v) => `chore(release): v${v}`,
  },
};

const CWS_VARS = ['CWS_CLIENT_ID', 'CWS_CLIENT_SECRET', 'CWS_REFRESH_TOKEN', 'CWS_PUBLISHER_ID'];

module.exports = {
  DISTRIBUTION_ID, DEFAULT_AWS_REGION, ENVIRONMENTS, CWS_VARS,
};
