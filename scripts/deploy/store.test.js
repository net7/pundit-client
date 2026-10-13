const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore, describeError } = require('./store');

const NAME = 'publishers/pub/items/item';

const revision = (state, ...versions) => ({
  state,
  distributionChannels: versions.map((crxVersion) => ({ crxVersion, deployPercentage: 100 })),
});

// Fake v2 client: fetchStatus answers are consumed in order, the last one repeats.
const fakeApi = ({ upload = {}, statuses = [] } = {}) => {
  const calls = { upload: [], fetchStatus: [], publish: [] };
  let i = 0;
  return {
    calls,
    media: {
      upload: async (params) => {
        calls.upload.push(params);
        return { data: upload };
      },
    },
    publishers: {
      items: {
        fetchStatus: async (params) => {
          calls.fetchStatus.push(params);
          const data = statuses[Math.min(i, statuses.length - 1)];
          i += 1;
          return { data };
        },
        publish: async (params) => {
          calls.publish.push(params);
          return { data: { state: 'PENDING_REVIEW' } };
        },
      },
    },
  };
};

const store = (api) => createStore(api, {
  publisherId: 'pub', itemId: 'item', pollMs: 1, timeoutMs: 50,
});

test('getStatus normalizes a published-only item', async () => {
  const api = fakeApi({ statuses: [{ publishedItemRevisionStatus: revision('PUBLISHED', '1.13.0') }] });
  const status = await store(api).getStatus();
  assert.deepEqual(status, {
    published: '1.13.0', submitted: null, submittedState: null, pendingReview: false, version: '1.13.0',
  });
  assert.equal(api.calls.fetchStatus[0].name, NAME);
});

test('getStatus flags PENDING_REVIEW and STAGED submissions and takes the highest version', async () => {
  for (const state of ['PENDING_REVIEW', 'STAGED']) {
    const api = fakeApi({
      statuses: [{
        publishedItemRevisionStatus: revision('PUBLISHED', '1.13.0'),
        submittedItemRevisionStatus: revision(state, '1.13.1'),
      }],
    });
    const status = await store(api).getStatus();
    assert.equal(status.pendingReview, true, state);
    assert.equal(status.submittedState, state);
    assert.equal(status.version, '1.13.1');
  }
});

test('getStatus does not flag a rejected submission but still counts its version', async () => {
  const api = fakeApi({
    statuses: [{
      publishedItemRevisionStatus: revision('PUBLISHED', '1.13.0'),
      submittedItemRevisionStatus: revision('REJECTED', '1.13.1'),
    }],
  });
  const status = await store(api).getStatus();
  assert.equal(status.pendingReview, false);
  assert.equal(status.version, '1.13.1');
});

test('getStatus fails with the raw payload when no crxVersion is present', async () => {
  const api = fakeApi({ statuses: [{ itemId: 'item', publishedItemRevisionStatus: { state: 'PUBLISHED' } }] });
  await assert.rejects(store(api).getStatus(), /no crxVersion.*"itemId":"item"/);
});

test('upload resolves immediately on SUCCEEDED', async () => {
  const api = fakeApi({ upload: { uploadState: 'SUCCEEDED', crxVersion: '1.13.1' } });
  await store(api).upload(__filename, '1.13.1');
  assert.equal(api.calls.upload[0].name, NAME);
  assert.equal(api.calls.upload[0].media.mimeType, 'application/zip');
  assert.equal(api.calls.fetchStatus.length, 0);
});

test('upload polls while IN_PROGRESS until SUCCEEDED', async () => {
  const api = fakeApi({
    upload: { uploadState: 'IN_PROGRESS' },
    statuses: [{ lastAsyncUploadState: 'IN_PROGRESS' }, { lastAsyncUploadState: 'SUCCEEDED' }],
  });
  await store(api).upload(__filename, '1.13.1');
  assert.equal(api.calls.fetchStatus.length, 2);
});

test('upload fails when processing ends in FAILED or NOT_FOUND', async () => {
  for (const state of ['FAILED', 'NOT_FOUND']) {
    const api = fakeApi({ upload: { uploadState: 'IN_PROGRESS' }, statuses: [{ lastAsyncUploadState: state }] });
    await assert.rejects(store(api).upload(__filename, '1.13.1'), new RegExp(state));
  }
  const api = fakeApi({ upload: { uploadState: 'FAILED' } });
  await assert.rejects(store(api).upload(__filename, '1.13.1'), /FAILED/);
});

test('upload times out when processing never completes', async () => {
  const api = fakeApi({ upload: { uploadState: 'IN_PROGRESS' }, statuses: [{ lastAsyncUploadState: 'IN_PROGRESS' }] });
  await assert.rejects(store(api).upload(__filename, '1.13.1'), /still IN_PROGRESS/);
});

test('upload fails when the uploaded crxVersion differs from the chosen version', async () => {
  const api = fakeApi({ upload: { uploadState: 'SUCCEEDED', crxVersion: '1.13.0' } });
  await assert.rejects(store(api).upload(__filename, '1.13.1'), /1\.13\.0.*1\.13\.1/);
});

test('publish submits a default publish for the item', async () => {
  const api = fakeApi();
  const data = await store(api).publish();
  assert.deepEqual(api.calls.publish[0], { name: NAME, requestBody: { publishType: 'DEFAULT_PUBLISH' } });
  assert.equal(data.state, 'PENDING_REVIEW');
});

test('describeError maps API and OAuth errors to one line', () => {
  const apiErr = Object.assign(new Error('x'), {
    response: { status: 400, data: { error: { code: 400, message: 'Invalid version', status: 'INVALID_ARGUMENT' } } },
  });
  assert.equal(describeError(apiErr), 'HTTP 400: Invalid version');
  const oauthErr = Object.assign(new Error('invalid_grant'), {
    response: { status: 400, data: { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' } },
  });
  assert.equal(describeError(oauthErr), 'HTTP 400: invalid_grant (Token has been expired or revoked.)');
  assert.equal(describeError(new Error('boom')), 'boom');
});
