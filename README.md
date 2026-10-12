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
- **scripts/**: post-build steps for the embed and the Chrome extension.

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

### Builds

Each build writes to `dist/<configuration>/`.

| Command | Output |
|---|---|
| `npm run build:embed-stage` / `build:embed-prod` | `pundit.embed.js` for the embedded version |
| `npm run build:chrome-ext-stage` / `build:chrome-ext-prod` | the unpacked Chrome extension (it builds the embed first) |
| `npm run build:pdf-standalone-stage` / `build:pdf-standalone-prod` | the standalone PDF viewer |

Prod builds need `src/environments/local.prod.ts`, generated like `local.stage.ts`.

Each `build:chrome-ext-stage` increments the stage version in `scripts/.stage.version`.

## Deploy

### Embed (S3 + CloudFront)

```bash
./deploy.sh stage   # → s3://static-pundit/releases/stage
./deploy.sh prod    # → s3://static-pundit/releases
```

The script installs the dependencies, builds the embed, syncs it to S3 and invalidates CloudFront.

It needs:
- the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html);
- AWS credentials in the environment (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`) or an `AWS_PROFILE`. You can find them in 1Password, card "Pundit-AWS".

### Chrome extension

Build it with `npm run build:chrome-ext-<stage|prod>`, zip the content of `dist/chrome-ext-<stage|prod>/`, and upload it from the Chrome Web Store Developer Dashboard. Stage and prod are two separate store items.
