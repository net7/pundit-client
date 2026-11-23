const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extractHosts, checkHosts } = require('./env-check');

const STAGE_TS = 'src/environments/local.stage.ts';
const STAGE_URLS = 'src/environments/chrome-ext-urls.stage.js';
const PROD_TS = 'src/environments/local.prod.ts';

const STAGE_APP = 'app.thepund.netseven.work';
const PROD_APP = 'app.thepund.it';

const envTs = (app, api = `${app}/api`) => `
const apiBaseUrl = 'https://${api}';
const authBaseUrl = 'https://${app}/';
const googleAuth = 'https://accounts.google.com/o/oauth2/auth';
const egi = "https://aai.egi.eu/auth";
const staticUrl = \`https://static.thepund.it/assets\`;
`;

test('extractHosts finds unique lowercase hosts, without port, path or query', () => {
  const hosts = extractHosts("a='https://API.Example.com:8443/x?y=1' b=\"http://localhost:4200\" c='https://api.example.com#h'");
  assert.deepEqual(hosts, ['api.example.com', 'localhost']);
});

test('stage config with the stage application host and third-party hosts passes', () => {
  assert.deepEqual(checkHosts('stage', { [STAGE_TS]: envTs(STAGE_APP), [STAGE_URLS]: null }), []);
});

test('optional stage URL override is checked when present', () => {
  const urls = `module.exports = { API_BASE_URL: 'https://${STAGE_APP}/api', FEED_WEB_BASE_URL: 'https://feed.thepund.netseven.work/?url=' };`;
  assert.deepEqual(checkHosts('stage', { [STAGE_TS]: envTs(STAGE_APP), [STAGE_URLS]: urls }), []);
});

test('a stage file still on the annotation server is rejected, naming file and host', () => {
  const errors = checkHosts('stage', {
    [STAGE_TS]: envTs(STAGE_APP, 'api.thepund.netseven.work'), [STAGE_URLS]: null,
  });
  assert.ok(
    errors.some((e) => e.includes(STAGE_TS) && e.includes('api.thepund.netseven.work')),
    errors.join('\n'),
  );
});

test('a stage URL override still on the annotation server is rejected, naming file and host', () => {
  const urls = "module.exports = { API_BASE_URL: 'https://api.thepund.netseven.work' };";
  const errors = checkHosts('stage', { [STAGE_TS]: envTs(STAGE_APP), [STAGE_URLS]: urls });
  assert.ok(
    errors.some((e) => e.includes(STAGE_URLS) && e.includes('api.thepund.netseven.work')),
    errors.join('\n'),
  );
});

test('a prod file still on the annotation server is rejected, naming file and host', () => {
  const errors = checkHosts('prod', { [PROD_TS]: envTs(PROD_APP, 'api.thepund.it') });
  assert.ok(errors.some((e) => e.includes(PROD_TS) && e.includes('api.thepund.it')), errors.join('\n'));
});

test('local domains are rejected, naming file and host', () => {
  const errors = checkHosts('stage', { [STAGE_TS]: envTs('app.thepund.test'), [STAGE_URLS]: null });
  assert.ok(errors.some((e) => e.includes(STAGE_TS) && e.includes('app.thepund.test')), errors.join('\n'));
});

test('every local-host pattern is rejected', () => {
  ['localhost', '127.0.0.1', '0.0.0.0', 'pundit.local', 'app.localhost', 'app.thepund.test'].forEach((host) => {
    const text = `${envTs(STAGE_APP)}\nconst x = 'http://${host}:8000';`;
    const errors = checkHosts('stage', { [STAGE_TS]: text, [STAGE_URLS]: null });
    assert.ok(errors.some((e) => e.includes(host)), `${host}: ${errors.join('\n')}`);
  });
});

test('missing expected application host is rejected', () => {
  const errors = checkHosts('stage', { [STAGE_TS]: "const a = 'https://accounts.google.com';", [STAGE_URLS]: null });
  assert.ok(errors.some((e) => e.includes(STAGE_APP)), errors.join('\n'));
});

test("the other environment's host is rejected", () => {
  const text = `${envTs(STAGE_APP)}\nconst b = 'https://${PROD_APP}/api';`;
  const errors = checkHosts('stage', { [STAGE_TS]: text, [STAGE_URLS]: null });
  assert.ok(errors.some((e) => e.includes(PROD_APP)), errors.join('\n'));
});

test('prod requires the prod application host and rejects the stage one', () => {
  assert.deepEqual(checkHosts('prod', { [PROD_TS]: envTs(PROD_APP) }), []);
  const errors = checkHosts('prod', { [PROD_TS]: envTs(STAGE_APP) });
  assert.ok(errors.some((e) => e.includes(STAGE_APP)), errors.join('\n'));
});

test('missing required file is rejected', () => {
  const errors = checkHosts('prod', { [PROD_TS]: null });
  assert.ok(errors.some((e) => e.includes(PROD_TS) && /missing/.test(e)), errors.join('\n'));
});
