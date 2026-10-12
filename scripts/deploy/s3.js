// S3 + CloudFront through the aws CLI (same as the former deploy.sh).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { run } = require('./shell');
const { DISTRIBUTION_ID, DEFAULT_AWS_REGION } = require('./config');

if (!process.env.AWS_DEFAULT_REGION) process.env.AWS_DEFAULT_REGION = DEFAULT_AWS_REGION;

const aws = (args, opts) => run('aws', args, opts);

const whoami = async () => JSON.parse(await aws(['sts', 'get-caller-identity', '--output', 'json'], { capture: true })).Arn;

// null when version.json does not exist yet (first release on this prefix).
const readVersionJson = async (prefix) => {
  try {
    return JSON.parse(await aws(['s3', 'cp', `${prefix}/version.json`, '-'], { capture: true }));
  } catch (err) {
    if (/\(404\)|Not Found|NoSuchKey/i.test(err.message)) return null;
    throw err;
  }
};

const syncCommand = (dir, prefix) => ['s3', 'sync', '--acl', 'public-read', `${dir}/`, prefix];

// No --delete: releases/ also holds stage/, a destructive prod sync would wipe it.
const sync = (dir, prefix) => aws(syncCommand(dir, prefix));

const versionJsonCommand = (file, prefix) => [
  's3', 'cp', file, `${prefix}/version.json`,
  '--acl', 'public-read', '--cache-control', 'no-cache', '--content-type', 'application/json',
];

const writeVersionJson = async (prefix, content) => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pundit-release-')), 'version.json');
  fs.writeFileSync(file, `${JSON.stringify(content, null, 2)}\n`);
  try {
    await aws(versionJsonCommand(file, prefix));
  } finally {
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
  }
};

const invalidateCommand = (paths) => ['cloudfront', 'create-invalidation', '--distribution-id', DISTRIBUTION_ID, '--paths', paths];

const invalidate = (paths) => aws(invalidateCommand(paths));

module.exports = {
  whoami, readVersionJson, sync, syncCommand, writeVersionJson, versionJsonCommand, invalidate, invalidateCommand,
};
