const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  parse, compare, nextVersions, checkAgreement, validateCandidate,
} = require('./version');

test('parse accepts well-formed versions per env', () => {
  assert.deepEqual(parse('1.13.0', 'prod'), [1, 13, 0]);
  assert.deepEqual(parse('1.13.0.2', 'stage'), [1, 13, 0, 2]);
  assert.deepEqual(parse('0.0.65535', 'prod'), [0, 0, 65535]);
});

test('parse rejects malformed versions', () => {
  ['1.14', '1.14.0.0', '1.014.0', '1.70000.0', '1.2.x', ' 1.2.3', ''].forEach((v) => {
    assert.throws(() => parse(v, 'prod'), /Invalid prod version/, v);
  });
  ['1.14.0', '1.14.0.0.1', '1.14.0.01'].forEach((v) => {
    assert.throws(() => parse(v, 'stage'), /Invalid stage version/, v);
  });
});

test('compare orders numerically and pads missing parts with zero', () => {
  assert.equal(compare('1.10.0', '1.9.9'), 1);
  assert.equal(compare('1.13.0', '1.13.0'), 0);
  assert.equal(compare('1.13.0', '1.13.0.0'), 0);
  assert.equal(compare('1.13.0', '1.13.0.1'), -1);
});

const next = (env, pkgVersion, stageVersion) => nextVersions(env, { pkgVersion, stageVersion })
  .map((o) => o.version);

test('prod next versions are patch, minor and major when stage has no newer base', () => {
  assert.deepEqual(next('prod', '1.13.0', '1.13.0.2'), ['1.13.1', '1.14.0', '2.0.0']);
  assert.deepEqual(next('prod', '1.13.4', '1.12.0.0'), ['1.13.5', '1.14.0', '2.0.0']);
});

test('prod proposes the version tested on stage first', () => {
  assert.deepEqual(nextVersions('prod', { pkgVersion: '1.13.0', stageVersion: '1.14.0.3' }), [
    { version: '1.14.0', label: 'tested on stage as 1.14.0.3' },
    { version: '1.13.1', label: 'patch' },
    { version: '2.0.0', label: 'major' },
  ]);
});

test('prod keeps a stage base that is not a plain bump', () => {
  assert.deepEqual(next('prod', '1.13.0', '1.15.0.0'), ['1.15.0', '1.13.1', '1.14.0', '2.0.0']);
});

test('stage next version increments N while its base is not released in prod', () => {
  assert.deepEqual(next('stage', '1.13.0', '1.14.0.0'), ['1.14.0.1']);
  assert.deepEqual(next('stage', '1.13.1', '1.14.0.2'), ['1.14.0.3']);
});

test('stage next version starts a new base once its base is released in prod', () => {
  assert.deepEqual(next('stage', '1.14.0', '1.14.0.3'), ['1.14.1.0', '1.15.0.0', '2.0.0.0']);
  assert.deepEqual(next('stage', '1.13.0', '1.13.0.1'), ['1.13.1.0', '1.14.0.0', '2.0.0.0']);
  assert.deepEqual(next('stage', '1.14.1', '1.14.0.3'), ['1.14.2.0', '1.15.0.0', '2.0.0.0']);
});

test('next versions reject malformed inputs', () => {
  assert.throws(() => next('stage', '1.13.0', '1.13.0'), /Invalid stage version/);
  assert.throws(() => next('prod', '1.13.0.1', '1.13.0.1'), /Invalid prod version/);
});

test('checkAgreement passes when all sources match', () => {
  const r = checkAgreement({ local: '1.13.0', store: '1.13.0', s3: '1.13.0' });
  assert.equal(r.agreed, true);
  assert.equal(r.current, '1.13.0');
});

test('checkAgreement ignores a missing S3 version (bootstrap)', () => {
  const r = checkAgreement({ local: '1.13.0', store: '1.13.0', s3: null });
  assert.equal(r.agreed, true);
  assert.equal(r.current, '1.13.0');
});

test('checkAgreement reports a mismatch with the highest version seen', () => {
  const r = checkAgreement({ local: '1.13.0', store: '1.13.1', s3: '1.13.0' });
  assert.equal(r.agreed, false);
  assert.equal(r.current, '1.13.0');
  assert.equal(r.highest, '1.13.1');
});

const prodCtx = { allowed: ['1.13.1', '1.14.0', '2.0.0'], remotes: ['1.13.0', '1.13.0'] };

test('validateCandidate accepts an allowed successor without forcing', () => {
  assert.deepEqual(validateCandidate('prod', '1.14.0', prodCtx), { ok: true, forced: false });
});

test('validateCandidate flags jumps as needing force', () => {
  ['1.13.2', '1.15.0', '2.1.0'].forEach((v) => {
    const r = validateCandidate('prod', v, prodCtx);
    assert.equal(r.ok, true, v);
    assert.equal(r.forced, true, v);
  });
});

test('validateCandidate rejects malformed versions even when forced', () => {
  const r = validateCandidate('prod', '1.15', prodCtx);
  assert.equal(r.ok, false);
  assert.match(r.error, /Invalid prod version/);
});

test('validateCandidate rejects versions not above every remote', () => {
  const ctx = { allowed: [], remotes: ['1.14.0', null] };
  ['1.14.0', '1.13.5'].forEach((v) => {
    const r = validateCandidate('prod', v, ctx);
    assert.equal(r.ok, false, v);
    assert.match(r.error, /must be greater than 1\.14\.0/, v);
  });
});

test('validateCandidate accepts a forced stage version above remotes', () => {
  const ctx = { allowed: ['1.13.0.3'], remotes: ['1.13.0.2', '1.13.0.2'] };
  assert.deepEqual(validateCandidate('stage', '1.13.0.3', ctx), { ok: true, forced: false });
  assert.deepEqual(validateCandidate('stage', '1.13.0.9', ctx), { ok: true, forced: true });
});
