## Why

The Angular 22 upgrade left the project pinned to the ESLint 8 generation because the existing `.eslintrc.json` stack is not compatible with the ESLint 9/10 flat config requirement used by `@angular-eslint@22`. ESLint 8 is end-of-life, so the lint toolchain needs to move forward without changing the app's current linting contract.

## What Changes

- Replace the legacy `.eslintrc.json` setup with an ESLint flat config.
- Upgrade the lint-related dev dependencies to the Angular 22-compatible generation: ESLint 9 or 10, `@angular-eslint@22`, and matching supported peer dependencies.
- Remove the legacy Airbnb shareable config dependency instead of bridging it through `FlatCompat`.
- Rebuild the lint baseline from native flat-config-compatible packages, preserving the project's intentional TypeScript rule substitutions, size limits, ignored paths, import-rule choices, and disabled Angular preferences.
- Expand HTML template linting to include Angular ESLint's recommended template rules while preserving the existing template `max-lines` rule.
- Fix or explicitly document any new Angular template lint findings introduced by the recommended template rules.
- Keep the existing `npm run lint` and lint-staged pre-commit workflow functional.

## Capabilities

### New Capabilities
- `linting-toolchain`: Covers how the project provides and verifies JavaScript, TypeScript, and Angular template linting.

### Modified Capabilities

## Impact

- Affected files include `package.json`, `package-lock.json`, `.eslintrc.json`, a new `eslint.config.js`, and any lint script or pre-commit configuration required by the migration.
- `eslint-config-airbnb-base` should be removed from dev dependencies if no longer needed by the new config.
- The change affects developer tooling only; it should not alter application runtime behavior, Angular build output, public APIs, or bundle contents.
- Verification requires comparing `npm run lint` behavior before and after the migration, resolving the intentionally added template recommended findings, and confirming lint-staged still invokes `eslint --fix` for staged TypeScript and HTML files.
