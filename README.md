# Pundit Annotator

Pundit is a tool for creating annotations on the web. This repository hosts the code of
Pundit's client.

The client is built with TypeScript, Angular, and N7's front-end framework. It can be used both as a
Chrome extension and in an embedded environment.

The app is built using the shadow-root in order to maximize the compatibility with external websites and applications.

## Structure

The client is self-contained:

- **Networking**: the layer that talks to the Pundit back-end (annotations, notebooks, authentication, AI) lives in this repository, under `src/communication`. It used to be the separate `pundit-communication` library.
- **Anchoring and highlighting**: provided by the `@net7/annotator` package.

In `src/` you will find:

- **app**: the main folder where the majority of the client's code is located. For a detailed view of the app folder, [refer to the readme document in src/app](./src/app/README.md).
- **chrome-ext**: files included only when building the client for the Chrome extension / Web Store (manifest, background and content scripts).
- **common**: the shared files that are compiled both into the Chrome extension and into the embedded versions.
- **communication**: the networking layer. It is consumed through `src/communication/index.ts`.
- **environments**: the parameters needed to build each environment (chrome-ext prod/stage, embedded prod/stage, local).
- **html-examples**: mockup web pages where you can view the client locally for testing purposes.
- **styles**: all of the CSS for the project, written in SCSS.
- **testing**: shared test doubles (e.g. the `src/communication` mock used by Jest).

Outside `src/`:

- **openspec/**: specifications (`openspec/specs`) and proposed or archived changes (`openspec/changes`).
- **scripts/**: post-build steps for the embed and the Chrome extension, and the local release script (`deploy.js`, see [Releasing](#releasing-stage--prod)).

## Development

### Prerequisites

- Git
- Node.js 22.22.3 (see `.node-version`) and npm 10.9.8. `engine-strict` is on: `npm install` fails with other versions.

The Angular CLI (Angular 22) is a dev dependency: use it through the npm scripts or `npx ng`.

### Running the client locally

1. Run `npm install`.
2. Create `src/environments/local.stage.ts`. Generate it with `pundit-deployment/scripts/render-env.sh`, or copy `src/environments/local.example.ts` and fill it in. The file is git-ignored, and every build that is not prod (including `npm run start`) imports it.
3. Run `npm run start` to serve the application on http://localhost:4200/.

The dev server proxies `/api`, `/ai` and `/sanctum` to `https://app.thepund.test`, a local Pundit back-end (see `proxy.conf.json`).

### Tests and linting

- `npm test`: Jest unit tests (`src/**/*.spec.ts`).
- `npm run lint`: ESLint on TypeScript and templates.
- `npm run stylelint`: Stylelint on the SCSS.
- `npm run test:scripts`: Node tests of the release script (`scripts/**/*.test.js`).

### Builds

Each build writes to `dist/<configuration>/`.

| Command                                                            | Output                                                    |
| ------------------------------------------------------------------ | --------------------------------------------------------- |
| `npm run build:embed-stage` / `build:embed-prod`                   | `pundit.embed.js` for the embedded version                |
| `npm run build:chrome-ext-stage` / `build:chrome-ext-prod`         | the unpacked Chrome extension (it builds the embed first) |
| `npm run build:pdf-standalone-stage` / `build:pdf-standalone-prod` | the standalone PDF viewer                                 |

Prod builds need `src/environments/local.prod.ts`, generated like `local.stage.ts`.

## Releasing (stage / prod)

Releases run **from a developer machine only** (never in CI) with:

```bash
npm run deploy:stage
npm run deploy:prod
```

One run releases the same version to both targets of the environment:

|                                             | stage                                 | prod                          |
| ------------------------------------------- | ------------------------------------- | ----------------------------- |
| Embed (`pundit.embed.js`, used by the feed) | `s3://static-pundit/releases/stage`   | `s3://static-pundit/releases` |
| Chrome extension                            | store item "Pundit Annotator (STAGE)" | store item "Pundit Annotator" |
| Version                                     | `scripts/.stage.version` (`X.Y.Z.N`)  | `package.json` (`X.Y.Z`)      |
| Git tag                                     | `stage-X.Y.Z.N`                       | `vX.Y.Z`                      |

Building (`npm run build:chrome-ext-stage`) never changes the version: only a release does.

### What the script does

1. **Pre-flight**: clean working tree; for prod, branch `master` in sync with `origin/master`; `zip` and `aws` on `PATH`; environment config pointing at the right domains (no `*.test`/`localhost`); credentials; AWS identity; Chrome Web Store token.
2. **Version gate**: reads the local version, the store version (published or last submitted) and `version.json` on S3. They must match. It then proposes the next version (prod: patch/minor/major; stage: `.N+1`, or `X.Y.Z.0` after a prod bump). Jumps are refused unless forced.
3. **Confirmation 1** on a summary, then `npm ci` + build, and verification of the built artifacts (manifest version included).
4. **Store upload** of the zip as a draft (validated by Google, not published), then **confirmation 2**.
5. **Go live**: store publish (goes to review), S3 sync, `version.json`, CloudFront invalidation, commit of the version files + annotated tag. **Pushing is up to you**: `git push --follow-tags`.

If something fails before confirmation 2, the version files are restored and nothing is live. If a step fails after it, nothing is rolled back: the script prints what was done and the exact commands that finish the release by hand.

Options:

- `npm run deploy:stage -- --dry-run`: runs everything up to the build, then restores the version files; nothing is uploaded.
- `npm run deploy:prod -- --force-version 1.15.0`: forces a version that breaks the no-jump/alignment rules (re-typing it is required). It must still be well-formed and greater than every released version.

### Prerequisites

- Node as in `.node-version`, the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) and `zip`.
- Environment config for the target environment, generated by `pundit-deployment/scripts/render-env.sh`:
  - stage: `src/environments/local.stage.ts`, and optionally `chrome-ext-urls.stage.js`, pointing at `*.thepund.test`;
  - prod: `src/environments/local.prod.ts`, pointing at `*.thepund.it`.

  A config generated for a local deployment (`*.thepund.test`) is refused.

- `scripts/.deploy.env` (git-ignored), copied from `scripts/.deploy.env.example`. Variables exported in the shell take precedence over the file.
  - AWS: the usual `AWS_*` variables, or `AWS_PROFILE` (the Pundit-AWS card on 1Password).

### One-time Chrome Web Store API setup

The script uses the Chrome Web Store API V2 through Google's official client `@googleapis/chromewebstore`.

A plain API key cannot be used here. Uploading and publishing act on the publisher's private items, so every call needs an OAuth 2.0 access token with the `https://www.googleapis.com/auth/chromewebstore` scope. The script gets that token from an OAuth client plus a refresh token.

**Google Cloud project.** The release OAuth client lives in the Google Cloud project `pundit-1058`. If the project also hosts the OAuth client used by Pundit's Google login, its consent screen is shared with real users. Add a new client, but do not change the consent screen's audience, branding or publishing status.

1. **Enable the API**: in the project, open *APIs & Services > Library*, search for **Chrome Web Store API** and click **Enable**.
2. **Consent screen** (*Google Auth Platform*, formerly "OAuth consent screen"). Only needed if the project has none yet.
   - Choose audience **Internal** if the project and the account owning the store items belong to the same Google Workspace organization.
   - Otherwise choose **External** and **publish it to "In production"**: in "Testing" status, refresh tokens expire after 7 days. Google verification is not needed for this use.
3. **OAuth client**: open *Credentials > Create credentials > OAuth client ID*.
   - Type: **Web application**.
   - Leave **Authorized JavaScript origins** empty.
   - Add `https://developers.google.com/oauthplayground` to **Authorized redirect URIs**.
   - On creation, copy the client ID and the client secret right away (Google may not show the secret again) into `CWS_CLIENT_ID` and `CWS_CLIENT_SECRET`.
4. **Refresh token**, in the [OAuth Playground](https://developers.google.com/oauthplayground):
   1. Click the gear icon, tick **Use your own OAuth credentials**, and paste the client ID and secret.
   2. In **Input your own scopes**, enter `https://www.googleapis.com/auth/chromewebstore`, then click **Authorize APIs**.
   3. Sign in **with the Google account that owns both store items** (2-step verification on). An "unverified app" warning is expected: click *Advanced > Go to …*.
   4. Click **Exchange authorization code for tokens** and copy the refresh token into `CWS_REFRESH_TOKEN`.
5. **IDs**, in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole):
   - publisher ID from *Publisher > Settings* → `CWS_PUBLISHER_ID`;
   - the 32-letter item ID shown on each item's page (also in its store URL) → `CWS_EXTENSION_ID_STAGE` and `CWS_EXTENSION_ID_PROD`.
6. **Check** (optional): in the Playground, send a GET to `https://chromewebstore.googleapis.com/v2/publishers/<publisher ID>/items/<item ID>:fetchStatus`. The response shows the item's published `crxVersion`.

Keep the client secret and the refresh token only in `scripts/.deploy.env` (and in 1Password). Together they allow publishing the extension to every user.

#### The refresh token

Access tokens last one hour. The refresh token is the long-lived credential the script exchanges for a fresh access token on every run, so nobody has to sign in during a release.

It has no fixed expiry. It stops working when:
- the consent screen is External and still in "Testing" (after 7 days);
- it has not been used for 6 months;
- access is revoked from https://myaccount.google.com/permissions by the owning account;
- the client secret is reset or the OAuth client is deleted;
- more than 100 refresh tokens are issued for the same client and account (the oldest are dropped).

When that happens, the pre-flight stops before changing anything, with an error like `HTTP 400: invalid_grant (Token has been expired or revoked.)`. Repeat step 4 and replace `CWS_REFRESH_TOKEN`: the client ID and secret stay the same.

Notes:

- If an item's visibility was changed in the Dashboard, the API refuses to publish until one manual publish is done there.
- A submission still in review (or approved and not yet published) blocks a new release: wait for it, or publish or cancel it from the Dashboard.
