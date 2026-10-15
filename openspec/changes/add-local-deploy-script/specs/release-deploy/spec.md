## ADDED Requirements

### Requirement: Single local release command per environment
The project SHALL provide `npm run deploy:stage` and `npm run deploy:prod`, both backed by `scripts/deploy.js`. One run SHALL release the same version to both targets of that environment:
- the embed bundle to S3 + CloudFront;
- the Chrome extension to that environment's Chrome Web Store item.

The script SHALL NOT be referenced by any build script or bundled into any Angular/webpack output. It SHALL refuse to run when stdin is not a TTY.

#### Scenario: Stage release targets
- **WHEN** the developer runs `npm run deploy:stage`
- **THEN** the embed is synced to `s3://static-pundit/releases/stage`, CloudFront paths `/releases/stage/*` are invalidated, and the extension is published to the item whose ID is `CWS_EXTENSION_ID_STAGE`

#### Scenario: Prod release targets
- **WHEN** the developer runs `npm run deploy:prod`
- **THEN** the embed is synced to `s3://static-pundit/releases` (no `--delete`), CloudFront paths `/releases/*` are invalidated, and the extension is published to the item whose ID is `CWS_EXTENSION_ID_PROD`

#### Scenario: Non-interactive invocation
- **WHEN** the script is started without a TTY on stdin
- **THEN** it exits with a non-zero code before contacting any remote service

### Requirement: Version formats
Prod versions SHALL have exactly three dot-separated integers (`X.Y.Z`). Stage versions SHALL have exactly four (`X.Y.Z.N`). Each part SHALL be an integer between 0 and 65535 with no leading zeros, as Chrome's manifest rules require.

#### Scenario: Malformed version rejected
- **WHEN** the candidate version is `1.14`, `1.14.0.0` for prod, `1.14.0` for stage, `1.014.0`, or `1.70000.0`
- **THEN** the script rejects it, even with `--force-version`

### Requirement: Local and remote versions must agree
Before proposing a version, the script SHALL read three versions:
- **Local**: `package.json` `version` for prod, `scripts/.stage.version` for stage.
- **Store**: the highest `crxVersion` among the published and submitted revisions returned by `fetchStatus` for the environment's item.
- **S3**: the `version` field of `version.json` at the environment's S3 prefix.

The script SHALL abort unless all available versions are equal.

#### Scenario: All aligned
- **WHEN** local, store and S3 versions are all `1.13.0`
- **THEN** the script proceeds to version selection with current version `1.13.0`

#### Scenario: Mismatch aborts
- **WHEN** local is `1.13.0` and the store reports `1.13.1`
- **THEN** the script aborts, printing each source and its version, unless `--force-version` is given

#### Scenario: S3 bootstrap
- **WHEN** `version.json` does not exist at the environment's S3 prefix
- **THEN** the script warns that the S3 version is unknown, excludes S3 from the agreement check, and asks for an explicit `[y/N]` confirmation before continuing

#### Scenario: Submission already in review
- **WHEN** `fetchStatus` reports a submitted revision in state `PENDING_REVIEW` or `STAGED` (approved, not yet published)
- **THEN** the script aborts, telling the developer to wait for the review, or to publish or cancel the submission from the Developer Dashboard

### Requirement: Next-version suggestion without jumps
The script SHALL only accept, without forcing, an allowed successor of the current version:

Stage `B.N` is the N-th candidate of the upcoming prod `B`. With `P` the 3-part `package.json` version (the last prod release) and `B.N` the content of `scripts/.stage.version`:
- **Prod**: `P` patch, minor and major (`X.Y.(Z+1)`, `X.(Y+1).0`, `(X+1).0.0`). If `B` is greater than `P`, `B` SHALL also be allowed and offered first. The script SHALL offer these as a choice and accept a manually typed version only if it is one of them.
- **Stage**:
  - if `B` is greater than `P` (prod `B` not released yet), the only allowed successor is `B.(N+1)`;
  - otherwise (prod `B` released), the allowed successors are `P` patch, minor and major followed by `.0`.

#### Scenario: Prod patch suggested
- **WHEN** the current prod version is `1.13.0` and the stage version is `1.13.0.2`
- **THEN** the choices offered are `1.13.1`, `1.14.0` and `2.0.0`

#### Scenario: Prod releases the version tested on stage
- **WHEN** the current prod version is `1.13.0` and the stage version is `1.14.0.3`
- **THEN** the choices offered are `1.14.0` first, then `1.13.1` and `2.0.0`

#### Scenario: Prod jump rejected
- **WHEN** the current prod version is `1.13.0` and the developer types `1.13.2`, `1.15.0` or `2.1.0`
- **THEN** the script rejects it as a jump and asks again

#### Scenario: Stage increment
- **WHEN** `package.json` is `1.13.0` and the current stage version is `1.14.0.0`
- **THEN** the proposed stage version is `1.14.0.1`

#### Scenario: Stage new base after a prod release
- **WHEN** `package.json` is `1.14.0` and the current stage version is `1.14.0.3`
- **THEN** the choices offered are `1.14.1.0`, `1.15.0.0` and `2.0.0.0`

### Requirement: Forced version
The developer SHALL be able to force a version that breaks the no-jump or agreement rules, either with `--force-version <v>` or by typing a non-successor at the prompt and accepting the warning. A forced version SHALL:
- be well-formed for the environment;
- be strictly greater than every available remote version (store and S3);
- be confirmed by re-typing it exactly.

#### Scenario: Forced jump accepted
- **WHEN** the current version is `1.13.0` and the developer runs with `--force-version 1.15.0`, then re-types `1.15.0`
- **THEN** the script continues with `1.15.0`

#### Scenario: Forced version not above remote
- **WHEN** the store reports `1.14.0` and the developer forces `1.14.0` or `1.13.5`
- **THEN** the script rejects it

#### Scenario: Re-type mismatch
- **WHEN** the developer forces `1.15.0` but re-types `1.5.0`
- **THEN** the script aborts without changing any file

### Requirement: Pre-flight checks
Before reading remote versions, the script SHALL verify each of the following and abort on the first failure:
- the git working tree is clean (no staged, unstaged or untracked files);
- for prod, the current branch is `master` and `HEAD` equals `origin/master` after `git fetch`;
- the `zip` and `aws` commands are available on `PATH`;
- the environment's configuration files pass the domain check;
- the required credentials are set;
- `aws sts get-caller-identity` succeeds;
- a Chrome Web Store access token can be obtained from the configured credentials.

Local checks run before network checks. Once the version is chosen, the script SHALL also abort if its tag already exists locally.

#### Scenario: Dirty tree
- **WHEN** the working tree has uncommitted changes
- **THEN** the script aborts and lists them

#### Scenario: Prod from a feature branch
- **WHEN** `deploy:prod` runs on a branch other than `master`
- **THEN** the script aborts

#### Scenario: Missing credentials
- **WHEN** a required `CWS_*` variable is absent from both the environment and `scripts/.deploy.env`
- **THEN** the script aborts, naming the missing variable

#### Scenario: zip not installed
- **WHEN** the `zip` command is not found on `PATH`
- **THEN** the script aborts before any build, saying that `zip` is required

### Requirement: Environment configuration domain check
The script SHALL scan the environment's configuration files:
- stage: `src/environments/local.stage.ts`, and `src/environments/chrome-ext-urls.stage.js` if present;
- prod: `src/environments/local.prod.ts`.

It SHALL extract every `http(s)` host from them and abort if:
- a required file is missing; or
- any host is `localhost`, a loopback IP, or ends in `.test`, `.local` or `.localhost`; or
- the expected API host is absent (`api.thepund.netseven.work` for stage, `api.thepund.it` for prod); or
- the other environment's API host is present.

The script SHALL NOT modify these files.

#### Scenario: Local domains in stage config
- **WHEN** `local.stage.ts` contains `https://api.thepund.test`
- **THEN** the script aborts, naming the file and the offending host

#### Scenario: Third-party hosts allowed
- **WHEN** `local.stage.ts` contains `https://accounts.google.com` and `https://api.thepund.netseven.work`
- **THEN** the domain check passes

### Requirement: Stage build does not bump the version
`build:chrome-ext-stage` SHALL write the contents of `scripts/.stage.version` into the stage manifest unchanged. It SHALL fail the build when the file is missing or malformed. Only the stage release SHALL change `scripts/.stage.version`.

#### Scenario: Repeated stage builds
- **WHEN** `npm run build:chrome-ext-stage` runs twice with `.stage.version` = `1.13.0.2`
- **THEN** both manifests have version `1.13.0.2` and `.stage.version` is unchanged

### Requirement: Build and artifact verification
After the version is confirmed, the script SHALL:
1. write it into `package.json` and `package-lock.json` (prod) or `scripts/.stage.version` (stage);
2. run `npm ci` and `npm run build:chrome-ext-<env>`;
3. verify that `dist/embed-<env>/pundit.embed.js` exists and that `dist/chrome-ext-<env>/manifest.json` exists with `version` equal to the chosen version.

On any failure before going live, the script SHALL restore the version files to `HEAD`.

#### Scenario: Manifest version mismatch
- **WHEN** the built manifest version differs from the chosen version
- **THEN** the script aborts, restores the version files and publishes nothing

### Requirement: Two confirmations and publish order
The script SHALL ask for `[y/N]` confirmation (default No) twice:
1. after showing the release summary (environment, current → new version, targets, branch, commit);
2. after the extension package has been uploaded to the store but before it is published.

After confirmation 2 it SHALL perform, in order:
1. store `publish`;
2. S3 sync of `dist/embed-<env>/` with `--acl public-read` and no `--delete`;
3. upload of `version.json` (`version`, `releasedAt`, `commit`);
4. CloudFront invalidation;
5. git commit of the version files and, for prod, creation of the annotated tag.

The store upload SHALL count as complete only when the package is processed:
- an `uploadState` of `SUCCEEDED` completes it immediately;
- an `uploadState` of `IN_PROGRESS` makes the script poll `fetchStatus` until `lastAsyncUploadState` is `SUCCEEDED`;
- `FAILED`, or a 120-second timeout, aborts before confirmation 2.

When the upload response reports a `crxVersion`, it SHALL equal the chosen version. The asynchronous path does not report one; the manifest version is verified before zipping.

#### Scenario: Asynchronous upload
- **WHEN** the upload returns `IN_PROGRESS` and a later `fetchStatus` reports `lastAsyncUploadState` `SUCCEEDED`
- **THEN** the script proceeds to confirmation 2

#### Scenario: Upload processing fails
- **WHEN** polling reports `FAILED` or 120 seconds pass without `SUCCEEDED`
- **THEN** the script aborts, restores the version files and publishes nothing

#### Scenario: Declined at confirmation 1
- **WHEN** the developer answers anything other than `y` to confirmation 1
- **THEN** no file is modified and nothing is uploaded

#### Scenario: Declined at confirmation 2
- **WHEN** the developer declines confirmation 2
- **THEN** the uploaded draft stays unpublished on the store, nothing is synced to S3, the version files are restored, and the script says the store draft exists

### Requirement: Failure reporting after going live
If a step after confirmation 2 fails, the script SHALL NOT roll back the steps already completed. It SHALL print which steps succeeded, which failed, and the exact commands that complete the release by hand.

#### Scenario: S3 failure after store publish
- **WHEN** the store publish succeeds and the S3 sync fails
- **THEN** the script prints that the extension is submitted, the S3 sync/`version.json`/invalidation/commit/tag commands still to run, and exits non-zero

### Requirement: Git record of the release
After all publish steps succeed, the script SHALL commit only the version files:
- prod: commit message `chore(release): v<version>`, plus an annotated tag `v<version>`;
- stage: commit message `chore(release): stage <version>`, no tag.

The script SHALL NOT push.

#### Scenario: Prod release recorded
- **WHEN** prod `1.14.0` is released successfully
- **THEN** a commit containing only `package.json` and `package-lock.json` and an annotated tag `v1.14.0` exist locally, and the script reminds the developer to push with `--follow-tags`

### Requirement: Dry run
With `--dry-run`, the script SHALL run the pre-flight checks, the remote version reads, the version selection and the build verification. It SHALL then restore the version files and exit without uploading, publishing or committing.

#### Scenario: Dry run leaves no trace
- **WHEN** the developer runs `npm run deploy:stage -- --dry-run` and confirms the version
- **THEN** the build completes, nothing is uploaded, and `git status` is clean afterwards
