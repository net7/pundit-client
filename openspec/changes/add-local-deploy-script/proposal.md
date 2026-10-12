## Why

Releases are done by hand today. `deploy.sh` covers only the embed upload to S3, and the Chrome Web Store upload is manual. Nothing checks the version being released: git tags stopped at `v1.9.2`, so no reliable record exists of what is live. The stage build also bumps `scripts/.stage.version` on **every** `build:chrome-ext-stage`, so the version drifts with local builds and the file is always dirty. Releasing the AI-annotation feature is the moment to make releases safe and repeatable.

## What Changes

- New local-only Node script `scripts/deploy.js` (with helpers under `scripts/deploy/`), run via `npm run deploy:stage` / `npm run deploy:prod`. In one run it releases the same version to both targets:
  - embed (`pundit.embed.js`, consumed by the feed) → S3 `static-pundit/releases[/stage]` + CloudFront invalidation;
  - Chrome extension → the Chrome Web Store item of that environment (two separate items: stage and prod), via the Chrome Web Store API V2 through Google's official client `@googleapis/chromewebstore`. Zipping and upload polling are done by our own code; zipping uses the system `zip` command.
- Version gate before any build or publish:
  - read the local version and the remote ones (store `fetchStatus`, new `version.json` on S3);
  - require them to agree;
  - suggest the next version or accept a manual one, and reject jumps unless forced;
  - ask for confirmation.
- `--force-version <v>` (or a manual jump typed at the prompt) bypasses only the no-jump and local/remote-alignment rules. It always requires re-typing the version, and the version must still be well-formed and greater than every remote version.
- Pre-flight checks:
  - clean working tree;
  - for prod, branch `master` in sync with `origin`;
  - valid AWS and Google credentials;
  - environment files point at the target environment's domains (no `.test`, `localhost` or loopback hosts).
- Build verification after `npm ci` + `npm run build:chrome-ext-<env>`: artifacts exist and the manifest carries the new version.
- Two confirmations: one on the version, one before going live (after the store upload has validated the package).
- After a successful release, commit the version bump and create a tag (`v<x.y.z>` for prod, `stage-<x.y.z.n>` for stage). Pushing stays manual.
- `--dry-run` runs the pre-flight checks, the version gate and the build, then stops before any upload.
- **BREAKING (dev workflow)**: `build:chrome-ext-stage` no longer bumps `scripts/.stage.version`; only the stage deploy does. `getStageVersion()` becomes a read-only `readStageVersion()` that throws instead of returning `null`.
- **BREAKING (dev workflow)**: `deploy.sh` is removed and replaced by the npm scripts.
- Credentials come from the git-ignored `scripts/.deploy.env`, with a tracked `scripts/.deploy.env.example`.
- The README's obsolete `push-prod.sh` section is replaced with the new release procedure.

## Capabilities

### New Capabilities
- `release-deploy`: local release of embed (S3/CloudFront) and Chrome extension (Chrome Web Store) for stage and prod. Covers the version gate (no jumps, forced override, local/remote alignment), pre-flight checks, build verification, confirmations, publish order, failure reporting, and the git commit/tag after release.

### Modified Capabilities
<!-- none: no existing spec covers build/release -->

## Impact

- **New code**: `scripts/deploy.js`, `scripts/deploy/*.js`, `scripts/deploy/*.test.js` (run with `node --test`, outside Jest), `scripts/.deploy.env.example`.
- **Changed code**: `scripts/chrome-ext-build.js` (stage version becomes read-only), `package.json` (`deploy:stage`, `deploy:prod`, `test:scripts`, new devDependency `@googleapis/chromewebstore`, pinned to an exact version), `.gitignore` (`scripts/.deploy.env`), `README.md`.
- **Removed**: `deploy.sh`.
- **External systems**:
  - S3 bucket `static-pundit` gains `releases/version.json` and `releases/stage/version.json`;
  - Chrome Web Store API V2 needs a one-time setup (Google Cloud OAuth client, refresh token, publisher ID, extension IDs);
  - the AWS CLI must be installed locally, as before; the `zip` command is now required too.
- **Not affected**: Angular and webpack bundles. `scripts/` is never bundled, and no CI hook is added.
