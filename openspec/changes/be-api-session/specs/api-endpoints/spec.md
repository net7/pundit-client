## ADDED Requirements

### Requirement: Builds point at the new BE API
`apiBaseUrl` SHALL be `<APP_URL>/api`, and `authBaseUrl` SHALL be `<APP_URL>/`, in every build. When the generated configuration provides no URL, the Chrome extension's defaults SHALL be `https://app.thepund.it/api` for prod and `https://app.thepund.netseven.work/api` for stage. `src/environments/local.example.ts` SHALL show one host for both, `apiBaseUrl` being that host plus `/api`.

#### Scenario: Stage extension without a generated URL
- **WHEN** the stage extension is built without `API_BASE_URL` in its generated configuration
- **THEN** the bundle calls `https://app.thepund.netseven.work/api`

### Requirement: Release check refuses the retired host
The release check (`scripts/deploy/env-check.js`) SHALL require the application's host in each generated environment file. It SHALL refuse a build whose environment files name the annotation server's host (`api.thepund.*`) or the other environment's API host, and SHALL name the offending file and host.

#### Scenario: Environment file still on the annotation server
- **WHEN** a stage release is checked and `local.stage.ts` names `api.thepund.netseven.work`
- **THEN** the check fails, naming the file and that host

#### Scenario: Correct environment files
- **WHEN** every generated file names the stage application's host and no forbidden host
- **THEN** the check passes
