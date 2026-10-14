const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extractHosts, checkHosts } = require('./env-check');

const STAGE_TS = 'src/environments/local.stage.ts';
const STAGE_URLS = 'src/environments/chrome-ext-urls.stage.js';
const PROD_TS = 'src/environments/local.prod.ts';

const stageTs = (api) => `
const apiBaseUrl = 'https://${api}';
const googleAuth = 'https://accounts.google.com/o/oauth2/auth';
const egi = "https://aai.egi.eu/auth";
const staticUrl = \`https://static.thepund.it/assets\`;
`;

test('extractHosts finds unique lowercase hosts, without port, path or query', () => {
  const hosts = extractHosts("a='https://API.Example.com:8443/x?y=1' b=\"http://localhost:4200\" c='https://api.example.com#h'");
  assert.deepEqual(hosts, ['api.example.com', 'localhost']);
});

test('stage config with the netseven API host and third-party hosts passes', () => {
  assert.deepEqual(checkHosts('stage', { [STAGE_TS]: stageTs('api.thepund.netseven.work'), [STAGE_URLS]: null }), []);
});

test('optional stage URL override is checked when present', () => {
  const urls = "module.exports = { API_BASE_URL: 'https://api.thepund.netseven.work', FEED_WEB_BASE_URL: 'https://feed.thepund.netseven.work/?url=' };";
  assert.deepEqual(checkHosts('stage', { [STAGE_TS]: stageTs('api.thepund.netseven.work'), [STAGE_URLS]: urls }), []);
});

test('local domains are rejected, naming file and host', () => {
  const errors = checkHosts('stage', { [STAGE_TS]: stageTs('api.thepund.test'), [STAGE_URLS]: null });
  assert.ok(errors.some((e) => e.includes(STAGE_TS) && e.includes('api.thepund.test')), errors.join('\n'));
});

test('every local-host pattern is rejected', () => {
  ['localhost', '127.0.0.1', '0.0.0.0', 'pundit.local', 'app.localhost', 'api.thepund.test'].forEach((host) => {
    const text = `${stageTs('api.thepund.netseven.work')}\nconst x = 'http://${host}:8000';`;
    const errors = checkHosts('stage', { [STAGE_TS]: text, [STAGE_URLS]: null });
    assert.ok(errors.some((e) => e.includes(host)), `${host}: ${errors.join('\n')}`);
  });
});

test('missing expected API host is rejected', () => {
  const errors = checkHosts('stage', { [STAGE_TS]: "const a = 'https://accounts.google.com';", [STAGE_URLS]: null });
  assert.ok(errors.some((e) => e.includes('api.thepund.netseven.work')), errors.join('\n'));
});

test("the other environment's API host is rejected", () => {
  const text = `${stageTs('api.thepund.netseven.work')}\nconst b = 'https://api.thepund.it';`;
  const errors = checkHosts('stage', { [STAGE_TS]: text, [STAGE_URLS]: null });
  assert.ok(errors.some((e) => e.includes('api.thepund.it')), errors.join('\n'));
});

test('prod requires api.thepund.it and rejects the stage API host', () => {
  assert.deepEqual(checkHosts('prod', { [PROD_TS]: stageTs('api.thepund.it') }), []);
  const errors = checkHosts('prod', { [PROD_TS]: stageTs('api.thepund.netseven.work') });
  assert.ok(errors.some((e) => e.includes('api.thepund.netseven.work')), errors.join('\n'));
});

test('missing required file is rejected', () => {
  const errors = checkHosts('prod', { [PROD_TS]: null });
  assert.ok(errors.some((e) => e.includes(PROD_TS) && /missing/.test(e)), errors.join('\n'));
});
