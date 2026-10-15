## 1. Baseline

- [x] 1.1 Confirm a clean working tree (`scripts/.stage.version` is currently dirty from a stage build: restore it to `HEAD` first) and record a green baseline: `npm run lint`, `npm test`, `npm run build:chrome-ext-stage`
- [x] 1.2 Verify the `@googleapis/chromewebstore@7` v2 surface (`auth.OAuth2`, `media.upload`, `publishers.items.fetchStatus`/`publish`, `GaxiosError` shape) against design D2/D4; note the deviations

## 2. Stage build stops bumping

- [x] 2.1 Replace `getStageVersion()` with `readStageVersion()` in `scripts/chrome-ext-build.js`: read + validate the 4-part version, throw on missing/malformed, no write
- [x] 2.2 Verify: two consecutive `npm run build:chrome-ext-stage` runs → both `dist/chrome-ext-stage/manifest.json` have the `.stage.version` value and `git status` is clean

## 3. Pure modules + tests (TDD)

- [x] 3.1 Add `test:scripts` (`node --test scripts/`) to `package.json`
- [x] 3.2 `scripts/deploy/version.test.js` covering every scenario of the "Version formats", "Local and remote versions must agree", "Next-version suggestion without jumps" and "Forced version" requirements (red)
- [x] 3.3 `scripts/deploy/version.js`: `parse`, `format`, `compare`, `successors`, `validateCandidate`, `checkAgreement` (green)
- [x] 3.4 `scripts/deploy/env-check.test.js`: deny list (`localhost`, `127.*`, `*.test`, `*.local`), required/forbidden API host per env, third-party hosts allowed, missing file (red)
- [x] 3.5 `scripts/deploy/env-check.js`: `checkHosts` (pure) + `checkEnvFiles(env)` (reads the files) (green)
- [x] 3.6 `scripts/deploy/config.js`: per-env constants (S3 prefix, invalidation path, distribution ID, expected/forbidden API host, CWS item env var, version files, tag/commit format)

## 4. I/O wrappers

- [x] 4.1 `scripts/deploy/shell.js`: promise `run(cmd, args, { capture, cwd })`, rejects with stderr on a non-zero exit
- [x] 4.2 `scripts/deploy/prompt.js`: `choose`, `ask`, `confirm` (default No) on `readline/promises`; TTY guard
- [x] 4.3 `scripts/deploy/git.js`: `assertClean`, `assertProdBranch` (`git fetch` + `HEAD == origin/master`), `tagExists`, `restore(files)`, `commitAndTag(files, message, tag)`
- [x] 4.4 `scripts/deploy/s3.js`: `whoami`, `readVersionJson` (missing → `null`), `sync` (`--acl public-read`, no `--delete`), `writeVersionJson` (`--cache-control no-cache`), `invalidate`; region default `eu-south-1`
- [x] 4.5 `scripts/deploy/zip.js`: `zipDir(dir, outFile)` via `zip -r -X` (cwd = dir); `commandExists('zip')` used by the pre-flight
- [x] 4.6 Install `@googleapis/chromewebstore` as a devDependency with an exact version (`--save-exact`)
- [x] 4.7 `scripts/deploy/store.test.js` with a fake client (red): status normalization (published/submitted/`PENDING_REVIEW`/no `crxVersion`), upload `SUCCEEDED`, `IN_PROGRESS` → `SUCCEEDED`, `FAILED`, timeout, `crxVersion` mismatch
- [x] 4.8 `scripts/deploy/store.js` (green): `createClient(creds)` (OAuth2 + refresh token), `createStore(client, { publisherId, itemId, pollMs, timeoutMs })` → `checkAuth()`, `getStatus()`, `upload(zipPath, expectedVersion)`, `publish()`; `GaxiosError` mapped to one line, no secrets
- [x] 4.9 Credentials: `process.loadEnvFile('scripts/.deploy.env')` if present, required-var check naming the missing keys, never printing values; add `scripts/.deploy.env.example`; add `scripts/.deploy.env` to `.gitignore`

## 5. Orchestrator

- [x] 5.1 `scripts/deploy.js`: argv (`<stage|prod>`, `--dry-run`, `--force-version <v>`), TTY guard, pre-flight in the spec's order
- [x] 5.2 Read versions (local, store, S3) → agreement check / S3 bootstrap confirm / pending-review abort
- [x] 5.3 Version selection: prod numbered menu + manual entry; stage single proposal; jump → force path with re-type; summary + confirmation 1; tag-exists check
- [x] 5.4 Write version files (`npm version <v> --no-git-tag-version` for prod, `.stage.version` for stage), `npm ci`, `npm run build:chrome-ext-<env>`, artifact verification; restore on failure; `--dry-run` exit point
- [x] 5.5 Zip (tmp dir, cleaned up at the end) → store upload with polling → confirmation 2 (decline → restore + report the draft) → store publish → S3 sync → `version.json` → invalidation → commit (+ annotated tag for prod) → push reminder
- [x] 5.6 Step tracker + failure report after going live (done/failed/pending + literal remaining commands, exit 1)
- [x] 5.7 Add `deploy:stage` / `deploy:prod` to `package.json`; remove `deploy.sh`

## 6. Docs

- [x] 6.1 README: replace the `push-prod.sh` section with prerequisites (aws CLI, `zip`, `.deploy.env`), one-time Chrome Web Store API setup (Cloud project, OAuth client in production status or a service account, refresh token, publisher ID, item IDs), env config regeneration, `deploy:*` usage, `--dry-run`, `--force-version`, recovery notes

## 7. Verification

- [x] 7.1 `npm run test:scripts` green; `npm run lint` and `npm test` still green
- [x] 7.2 Negative paths by hand: dirty tree, prod on a feature branch, `.test` hosts in `local.stage.ts`, missing `CWS_*` var, `zip` missing from `PATH`, mismatching `--force-version` re-type, decline at confirmation 1 → each aborts with a clear message and `git status` stays clean
- [ ] 7.3 With the real stage config + credentials: `npm run deploy:stage -- --dry-run` → build ok, nothing uploaded, tree clean
- [ ] 7.4 Guided first stage release with the user (S3 bootstrap, store upload + publish, release commit); the user pushes
