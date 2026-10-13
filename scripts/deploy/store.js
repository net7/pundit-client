// Chrome Web Store API V2 through Google's official client.
// The client does not zip nor wait for asynchronous uploads: both are done here.

const fs = require('fs');
const { setTimeout: sleep } = require('timers/promises');
const { max } = require('./version');

// Submissions that block a new upload until the developer acts on the Dashboard.
const BLOCKING_SUBMISSION_STATES = ['PENDING_REVIEW', 'STAGED'];

// One line, never the raw error: a GaxiosError carries the request config,
// Authorization header included.
const describeError = (err) => {
  const res = err && err.response;
  if (!res) return err.message;
  const { error, error_description: description } = res.data || {};
  if (error && typeof error === 'object') return `HTTP ${res.status}: ${error.message}`;
  if (typeof error === 'string') return `HTTP ${res.status}: ${error}${description ? ` (${description})` : ''}`;
  return `HTTP ${res.status}: ${err.message}`;
};

const clean = async (promise) => {
  try {
    return await promise;
  } catch (err) {
    throw new Error(describeError(err));
  }
};

const createClient = ({ clientId, clientSecret, refreshToken }) => {
  const { chromewebstore, auth } = require('@googleapis/chromewebstore');
  const oauth = new auth.OAuth2(clientId, clientSecret);
  oauth.setCredentials({ refresh_token: refreshToken });
  return {
    api: chromewebstore({ version: 'v2', auth: oauth }),
    checkAuth: () => clean(oauth.getAccessToken()),
  };
};

const revisionVersion = (revision) => max(
  ((revision && revision.distributionChannels) || []).map((c) => c.crxVersion),
);

const createStore = (api, {
  publisherId, itemId, pollMs = 2000, timeoutMs = 120000,
}) => {
  const name = `publishers/${publisherId}/items/${itemId}`;
  const fetchStatus = async () => (await clean(api.publishers.items.fetchStatus({ name }))).data;

  const getStatus = async () => {
    const data = await fetchStatus();
    const published = revisionVersion(data.publishedItemRevisionStatus);
    const submitted = revisionVersion(data.submittedItemRevisionStatus);
    const submittedState = (data.submittedItemRevisionStatus && data.submittedItemRevisionStatus.state) || null;
    if (!published && !submitted) {
      throw new Error(`Store status has no crxVersion for ${name}: ${JSON.stringify(data)}`);
    }
    return {
      published,
      submitted,
      submittedState,
      pendingReview: BLOCKING_SUBMISSION_STATES.includes(submittedState),
      version: max([published, submitted]),
    };
  };

  const waitForUpload = async () => {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      await sleep(pollMs);
      const state = (await fetchStatus()).lastAsyncUploadState;
      if (state === 'SUCCEEDED') return;
      if (state !== 'IN_PROGRESS') throw new Error(`Store upload processing ended in ${state}`);
      if (Date.now() > deadline) {
        throw new Error(`Store upload still IN_PROGRESS after ${timeoutMs / 1000}s`);
      }
    }
  };

  // Uploads a draft; nothing is published. crxVersion is checked when the API reports it
  // (the asynchronous path does not), the manifest version is verified before zipping anyway.
  const upload = async (zipPath, expectedVersion) => {
    const { data } = await clean(api.media.upload({
      name,
      media: { mimeType: 'application/zip', body: fs.createReadStream(zipPath) },
    }));
    if (data.uploadState === 'IN_PROGRESS') {
      await waitForUpload();
    } else if (data.uploadState !== 'SUCCEEDED') {
      throw new Error(`Store upload ended in ${data.uploadState}`);
    }
    if (data.crxVersion && data.crxVersion !== expectedVersion) {
      throw new Error(`Store received version ${data.crxVersion}, expected ${expectedVersion}`);
    }
  };

  const publish = async () => (await clean(api.publishers.items.publish({
    name,
    requestBody: { publishType: 'DEFAULT_PUBLISH' },
  }))).data;

  return { getStatus, upload, publish };
};

module.exports = { createClient, createStore, describeError };
