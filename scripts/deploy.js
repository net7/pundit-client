// Local-only release of the embed (S3 + CloudFront) and the Chrome extension
// (Chrome Web Store) for one environment, with a version gate.
//
// Usage: npm run deploy:stage|deploy:prod [-- --dry-run] [-- --force-version <v>]
// Spec: openspec/changes/add-local-deploy-script

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const argv = require('minimist')(process.argv.slice(2), { boolean: ['dry-run'], string: ['force-version'] });

const { ENVIRONMENTS } = require('./deploy/config');
const { ROOT, run, commandExists } = require('./deploy/shell');
const { parse, nextVersions, checkAgreement, validateCandidate } = require('./deploy/version');
const { checkEnvFiles } = require('./deploy/env-check');
const { loadCredentials } = require('./deploy/credentials');
const { createClient, createStore } = require('./deploy/store');
const { zipDir } = require('./deploy/zip');
const git = require('./deploy/git');
const s3 = require('./deploy/s3');
const prompt = require('./deploy/prompt');

const env = argv._[0];
const cfg = ENVIRONMENTS[env];
const dryRun = argv['dry-run'];
const forceVersion = argv['force-version'];

const STAGE_VERSION_FILE = path.join(ROOT, 'scripts/.stage.version');

// What an interruption or a failure has to clean up or report.
const state = { dirty: false, live: false, steps: [] };

const section = (title) => console.log(`\n── ${title}`);

const readPkgVersion = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;

const readLocalVersion = () => (env === 'prod'
  ? readPkgVersion()
  : fs.readFileSync(STAGE_VERSION_FILE, 'utf8').split(/\r?\n/)[0].trim());

const restoreVersionFiles = () => {
  spawnSync('git', ['checkout', 'HEAD', '--', ...cfg.versionFiles], { cwd: ROOT });
  state.dirty = false;
};

const report = () => {
  console.error('\nRelease state:');
  state.steps.forEach((s) => {
    const mark = { done: '✓', failed: '✗', pending: '·' }[s.status];
    console.error(`  ${mark} ${s.name}${s.error ? `: ${s.error}` : ''}`);
  });
  const todo = state.steps.filter((s) => s.status !== 'done');
  if (todo.length) {
    console.error('\nTo complete the release by hand (from the repo root):');
    todo.forEach((s) => console.error(`  # ${s.name}\n  ${s.manual}`));
  }
};

process.on('SIGINT', () => {
  if (state.live) {
    console.error('\nInterrupted while going live.');
    report();
  } else if (state.dirty) {
    restoreVersionFiles();
    console.error('\nInterrupted: version files restored.');
  } else {
    console.error('\nInterrupted.');
  }
  process.exit(130);
});

const preflight = async () => {
  section('Pre-flight');
  await git.assertClean();
  if (env === 'prod') await git.assertProdBranch();
  ['zip', 'aws'].forEach((cmd) => {
    if (!commandExists(cmd)) throw new Error(`${cmd} is required but was not found on PATH`);
  });
  const envErrors = checkEnvFiles(env);
  if (envErrors.length) {
    throw new Error(`Environment config is not ready for ${env} (regenerate it with render-env.sh):\n  ${envErrors.join('\n  ')}`);
  }
  console.log(`Environment config: ok (${Object.keys(cfg.envFiles).join(', ')})`);
  const creds = loadCredentials(env);
  console.log(`AWS identity: ${await s3.whoami()}`);
  const client = createClient(creds);
  await client.checkAuth();
  console.log('Chrome Web Store credentials: ok');
  return createStore(client.api, { publisherId: creds.publisherId, itemId: creds.itemId });
};

const readVersions = async (store) => {
  section('Versions');
  const pkgVersion = readPkgVersion();
  const local = readLocalVersion();
  parse(local, env);
  const status = await store.getStatus();
  if (status.pendingReview) {
    throw new Error(`Store item has a ${status.submittedState} submission (${status.submitted}): wait for the review, or publish/cancel it from the Developer Dashboard`);
  }
  const s3Json = await s3.readVersionJson(cfg.s3Prefix);
  const s3Version = s3Json ? s3Json.version : null;
  console.log(`  local  ${local}`);
  console.log(`  store  ${status.version}${status.submitted ? ` (published ${status.published || '-'}, last submitted ${status.submitted} ${status.submittedState})` : ''}`);
  console.log(`  S3     ${s3Version || 'unknown (no version.json)'}`);

  if (!s3Version && !(await prompt.confirm(`S3 has no version.json under ${cfg.s3Prefix} (first release there). Continue without checking it?`))) {
    throw new Error('Aborted: nothing changed');
  }
  const agreement = checkAgreement({ local, store: status.version, s3: s3Version });
  if (!agreement.agreed && !forceVersion) {
    throw new Error(`Local and remote versions disagree (highest seen: ${agreement.highest}). Align them, or use --force-version`);
  }
  return {
    local, pkgVersion, agreed: agreement.agreed, remotes: [status.version, s3Version],
  };
};

const chooseVersion = async ({ local, pkgVersion, agreed, remotes }) => {
  section('Version');
  let allowed;
  try {
    allowed = nextVersions(env, local, pkgVersion);
  } catch (err) {
    if (!forceVersion) throw err;
    allowed = [];
  }
  const labels = env === 'prod' ? ['patch', 'minor', 'major'] : ['next stage'];
  for (;;) {
    let candidate = forceVersion;
    if (!candidate) {
      candidate = await prompt.choose(
        `Current ${env} version ${local}. Next version:`,
        allowed.map((v, i) => ({ label: `${v} (${labels[i]})`, value: v })),
      );
      if (candidate === null) candidate = await prompt.ask('Version: ');
    }
    const result = validateCandidate(env, candidate, { allowed, remotes });
    if (!result.ok) {
      if (forceVersion) throw new Error(result.error);
      console.log(result.error);
      continue;
    }
    if (result.forced || !agreed) {
      console.log(`\n⚠ ${candidate} skips the release rules: ${result.forced ? `allowed next versions are ${allowed.join(', ') || 'none'}` : 'local and remote versions disagree'}.`);
      if (!forceVersion && !(await prompt.confirm(`Force ${candidate}?`))) continue;
      if ((await prompt.ask(`Re-type ${candidate} to confirm: `)) !== candidate) {
        throw new Error('Re-typed version does not match: aborted, nothing changed');
      }
    }
    return { version: candidate, forced: result.forced || !agreed };
  }
};

const writeVersion = async (version) => {
  state.dirty = true;
  if (env === 'prod') await run('npm', ['version', version, '--no-git-tag-version'], { capture: true });
  else fs.writeFileSync(STAGE_VERSION_FILE, version);
};

const verifyArtifacts = (version) => {
  const manifestPath = path.join(ROOT, cfg.extDist, 'manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error(`Build output missing: ${cfg.extDist}/manifest.json`);
  const manifestVersion = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).version;
  if (manifestVersion !== version) throw new Error(`Built manifest has version ${manifestVersion}, expected ${version}`);
  [`${cfg.extDist}/pundit.chrome-ext.js`, `${cfg.embedDist}/pundit.embed.js`].forEach((file) => {
    if (!fs.existsSync(path.join(ROOT, file))) throw new Error(`Build output missing: ${file}`);
  });
  console.log(`Artifacts ok: ${cfg.extDist} (manifest ${manifestVersion}), ${cfg.embedDist}/pundit.embed.js`);
};

const goLive = async (store, version, commit) => {
  const tag = cfg.tag(version);
  const message = cfg.commitMessage(version);
  const versionJson = { version, releasedAt: new Date().toISOString(), commit };
  const sh = (args) => args.map((a) => (/[\s*"']/.test(a) ? `'${a}'` : a)).join(' ');
  state.steps = [
    {
      name: 'Chrome Web Store publish',
      run: () => store.publish(),
      manual: 'Publish the uploaded draft from the Chrome Web Store Developer Dashboard',
    },
    {
      name: 'S3 sync',
      run: () => s3.sync(cfg.embedDist, cfg.s3Prefix),
      manual: `aws ${sh(s3.syncCommand(cfg.embedDist, cfg.s3Prefix))}`,
    },
    {
      name: 'S3 version.json',
      run: () => s3.writeVersionJson(cfg.s3Prefix, versionJson),
      manual: `echo '${JSON.stringify(versionJson)}' > /tmp/version.json && aws ${sh(s3.versionJsonCommand('/tmp/version.json', cfg.s3Prefix))}`,
    },
    {
      name: 'CloudFront invalidation',
      run: () => s3.invalidate(cfg.invalidationPath),
      manual: `aws ${sh(s3.invalidateCommand(cfg.invalidationPath))}`,
    },
    {
      name: `Git commit + tag ${tag}`,
      run: () => git.commitAndTag(cfg.versionFiles, message, tag),
      manual: `git commit -m '${message}' -- ${cfg.versionFiles.join(' ')} && git tag -a ${tag} -m '${message}'`,
    },
  ].map((s) => ({ ...s, status: 'pending' }));

  state.live = true;
  for (const step of state.steps) {
    console.log(`→ ${step.name}`);
    try {
      await step.run();
      step.status = 'done';
    } catch (err) {
      step.status = 'failed';
      step.error = err.message;
      report();
      throw new Error(`Release ${version} is incomplete`);
    }
  }
  state.live = false;
  state.dirty = false;
};

const main = async () => {
  if (!cfg) throw new Error('Usage: node scripts/deploy.js stage|prod [--dry-run] [--force-version <version>]');
  if ('force-version' in argv && !forceVersion) throw new Error('--force-version needs a version');
  if (!process.stdin.isTTY) throw new Error('deploy.js is interactive: run it from a terminal');

  const store = await preflight();
  const versions = await readVersions(store);
  const { version, forced } = await chooseVersion(versions);
  if (await git.tagExists(cfg.tag(version))) throw new Error(`Tag ${cfg.tag(version)} already exists`);

  const branch = await run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { capture: true });
  const commit = await git.headCommit();
  section('Summary');
  console.log(`  environment  ${env}${dryRun ? ' (dry run: build only, nothing is uploaded)' : ''}`);
  console.log(`  version      ${versions.local} → ${version}${forced ? '  ⚠ FORCED' : ''}`);
  console.log(`  embed        ${cfg.embedDist} → ${cfg.s3Prefix} (invalidate ${cfg.invalidationPath})`);
  console.log(`  extension    ${cfg.extDist} → Chrome Web Store item ${process.env[cfg.extensionIdVar]}`);
  console.log(`  source       ${branch} @ ${commit}`);
  console.log(`  git          commit "${cfg.commitMessage(version)}" + tag ${cfg.tag(version)} (not pushed)`);
  if (!(await prompt.confirm('Build this release?'))) {
    console.log('Nothing changed.');
    return;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pundit-release-'));
  try {
    section('Build');
    await writeVersion(version);
    await run('npm', ['ci']);
    await run('npm', ['run', cfg.buildScript]);
    verifyArtifacts(version);
    if (dryRun) {
      restoreVersionFiles();
      console.log('\nDry run complete: version files restored, nothing uploaded.');
      return;
    }

    section('Chrome Web Store upload (draft)');
    const zipPath = path.join(tmpDir, `pundit-${env}-${version}.zip`);
    await zipDir(path.join(ROOT, cfg.extDist), zipPath);
    await store.upload(zipPath, version);
    console.log('Draft uploaded and validated by the store (not published yet).');

    if (!(await prompt.confirm(`Go live with ${env} ${version}? (store publish, S3 sync, CloudFront invalidation, git commit + tag)`))) {
      restoreVersionFiles();
      console.log(`Not published. A ${version} draft stays on the store: discard it from the Developer Dashboard or publish it later. Version files restored.`);
      return;
    }
  } catch (err) {
    if (state.dirty) restoreVersionFiles();
    throw err;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  section('Go live');
  await goLive(store, version, commit);
  console.log(`\n✓ Released ${env} ${version}. The extension is now in store review.`);
  console.log('  Push the release commit and tag with: git push --follow-tags');
};

main()
  .catch((err) => {
    console.error(`\n✗ ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => prompt.close());
