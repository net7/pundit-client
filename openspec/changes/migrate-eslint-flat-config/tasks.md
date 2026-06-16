## 1. Baseline Current Lint Behavior

- [x] 1.1 Ensure Node 22.22.3 is active with `fnm`, install dependencies if needed, and capture the current `npm run lint` output on the ESLint 8 stack.
- [x] 1.2 Inspect `.eslintrc.json`, `package.json`, and lint-staged configuration to confirm all ignores, globs, rules, and overrides that must be preserved.

## 2. Upgrade Lint Dependencies

- [x] 2.1 Update lint dev dependencies to ESLint 9 or newer and `@angular-eslint@22`, keeping `@typescript-eslint` on a compatible v8 version.
- [x] 2.2 Remove `eslint-config-airbnb-base` from dev dependencies and do not add `@eslint/eslintrc` solely for `FlatCompat`.
- [x] 2.3 Add or keep only the lint plugins/config packages needed by the explicit flat config, such as `@eslint/js`, TypeScript ESLint, Angular ESLint, globals, and any intentionally retained import plugin rules.
- [x] 2.4 Regenerate the lockfile with the project package manager and verify dependency resolution has no peer conflicts.

## 3. Implement Flat Config

- [x] 3.1 Create `eslint.config.js` as the active flat config entrypoint.
- [x] 3.2 Port the legacy ignore patterns into flat config `ignores`.
- [x] 3.3 Build the baseline from native flat-config-compatible ESLint, TypeScript ESLint, and Angular ESLint config APIs.
- [x] 3.4 Port the TypeScript lint block, including Angular rules, inline template processing, project-specific rule overrides, intentionally retained import-rule choices, and disabled `prefer-standalone` / `prefer-inject`.
- [x] 3.5 Port the `*.spec.ts` and mock-file overrides so their size limits remain disabled.
- [x] 3.6 Port the `*.html` override with the Angular template parser/plugin, Angular ESLint's recommended template rules, and the existing template `max-lines` rule.
- [x] 3.7 Delete `.eslintrc.json` after the flat config is in place.

## 4. Preserve Developer Workflows

- [x] 4.1 Confirm `npm run lint` still targets `src/**/*.ts` and `src/**/*.html` and loads the flat config automatically.
- [x] 4.2 Confirm lint-staged still runs `eslint --fix` for staged TypeScript and HTML files.

## 5. Verify Intentional Parity

- [x] 5.1 Run `npm run lint` and compare findings with the ESLint 8 baseline, documenting unavoidable version-driven differences and intentional differences caused by removing Airbnb defaults or adding Angular template recommended rules.
- [x] 5.2 Fix straightforward findings introduced by Angular template recommended rules, or add explicit local exceptions with a short rationale when a rule should not apply.
- [x] 5.3 Verify ignored files are still ignored by checking at least one representative ignored path.
- [x] 5.4 Verify the active config does not import `eslint-config-airbnb-base` or use `FlatCompat` for Airbnb.
- [x] 5.5 Run the relevant package-manager validation command to confirm the dependency tree is consistent.
- [x] 5.6 Review the final diff to ensure changes are limited to lint tooling/configuration and template fixes required by the new recommended template baseline.
