## ADDED Requirements

### Requirement: Flat config lint entrypoint
The project SHALL use ESLint flat config as the active lint configuration entrypoint.

#### Scenario: ESLint runs with flat config
- **WHEN** a developer runs `npm run lint`
- **THEN** ESLint MUST load `eslint.config.js` without requiring `.eslintrc.json`

#### Scenario: Legacy config removed
- **WHEN** the flat config migration is complete
- **THEN** `.eslintrc.json` MUST no longer be present as an active lint configuration file

### Requirement: Angular 22 compatible lint dependencies
The project SHALL use lint dependencies compatible with Angular 22 and modern ESLint flat config.

#### Scenario: Dependency versions support Angular ESLint 22
- **WHEN** project dependencies are installed
- **THEN** `@angular-eslint` packages MUST be on the Angular 22-compatible generation

#### Scenario: ESLint version supports flat config
- **WHEN** project dependencies are installed
- **THEN** ESLint MUST be on version 9 or newer

#### Scenario: Airbnb config removed
- **WHEN** project dependencies are installed
- **THEN** `eslint-config-airbnb-base` MUST NOT be required by the active lint configuration

#### Scenario: Native flat config packages provide the baseline
- **WHEN** ESLint evaluates source files
- **THEN** the lint baseline MUST be built from native flat-config-compatible ESLint, TypeScript ESLint, and Angular ESLint configuration APIs plus explicit local rules

### Requirement: Existing TypeScript lint contract preserved
The flat config SHALL preserve the intentional TypeScript linting behavior for application source files.

#### Scenario: Project-specific TypeScript rules are retained
- **WHEN** ESLint evaluates TypeScript source files
- **THEN** it MUST apply the existing explicit project-specific rules, including `complexity`, `max-lines`, `max-lines-per-function`, TypeScript replacements for overlapping core rules, and the current disabled rules for explicit return types and explicit `any`

#### Scenario: Legacy Airbnb defaults are not treated as mandatory
- **WHEN** the flat config is implemented
- **THEN** Airbnb-provided rule defaults MUST NOT be preserved unless they are intentionally re-added as explicit local rules

#### Scenario: Angular preferences remain disabled
- **WHEN** ESLint evaluates Angular TypeScript source files
- **THEN** `@angular-eslint/prefer-standalone` and `@angular-eslint/prefer-inject` MUST remain disabled

#### Scenario: Existing ignored paths remain ignored
- **WHEN** ESLint runs through `npm run lint`
- **THEN** it MUST continue ignoring the paths previously listed in `.eslintrc.json` `ignorePatterns`

### Requirement: Existing override behavior preserved
The flat config SHALL preserve the current file-specific lint overrides.

#### Scenario: Spec files keep relaxed size limits
- **WHEN** ESLint evaluates `*.spec.ts` files
- **THEN** `max-lines` and `max-lines-per-function` MUST be disabled for those files

#### Scenario: Mock files keep relaxed size limits
- **WHEN** ESLint evaluates files under `src/app/mocks/**/*.ts` or matching `src/**/*.mock.ts`
- **THEN** `max-lines` and `max-lines-per-function` MUST be disabled for those files

#### Scenario: HTML template linting uses Angular recommended rules
- **WHEN** ESLint evaluates `*.html` files
- **THEN** it MUST use the Angular template parser/plugin, Angular ESLint's recommended template rules, and the existing template `max-lines` rule

#### Scenario: Template accessibility rules are not broadly enabled
- **WHEN** ESLint evaluates `*.html` files
- **THEN** Angular template accessibility rules MUST NOT be enabled unless they are included by Angular ESLint's recommended template baseline

### Requirement: Template recommended findings resolved
The migration SHALL account for new findings introduced by Angular ESLint's recommended template rules.

#### Scenario: Recommended template findings are handled
- **WHEN** `npm run lint` is executed after the flat config migration
- **THEN** findings from Angular ESLint's recommended template rules MUST either be fixed or covered by an explicit documented local exception

### Requirement: Developer lint workflows preserved
The migration SHALL keep existing developer lint commands and staged-file automation functional.

#### Scenario: NPM lint script remains usable
- **WHEN** a developer runs `npm run lint`
- **THEN** the command MUST lint the same TypeScript and HTML file globs as before the migration

#### Scenario: Lint staged still fixes staged files
- **WHEN** the husky pre-commit hook invokes lint-staged for staged TypeScript or HTML files
- **THEN** lint-staged MUST continue running `eslint --fix`

### Requirement: Lint migration does not change runtime behavior
The migration SHALL be limited to lint tooling and configuration.

#### Scenario: Application source is not refactored for unrelated lint churn
- **WHEN** the migration is implemented
- **THEN** application source changes MUST be limited to those strictly required for lint tool compatibility

#### Scenario: Build and bundle behavior remain out of scope
- **WHEN** the migration is implemented
- **THEN** Angular build configuration, runtime code paths, and bundle generation MUST remain unchanged unless a lint tooling compatibility issue requires a documented exception
