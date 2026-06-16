## Context

The project currently runs Angular 22, TypeScript 6, Jest 30, and the Angular application builder, but its lint stack remains pinned to ESLint 8 with `@angular-eslint@20` because the existing `.eslintrc.json` configuration is not valid for ESLint 9/10 flat config. The current lint contract is intentionally project-specific: it uses a legacy Airbnb base config plus local rule overrides, TypeScript replacements for overlapping core rules, Angular TypeScript lint rules, inline template processing, minimal HTML template linting, project ignore patterns, and targeted overrides for specs and mocks.

The migration must update the tooling without carrying forward obsolete dependencies as a compatibility liability. Airbnb was useful when this lint setup was created, but it is now an eslintrc-era dependency with weak modern flat-config fit. The post-migration lint behavior should preserve the project's explicit rules and workflow, while allowing deliberate removal of Airbnb defaults that are not intentionally part of the local contract.

## Goals / Non-Goals

**Goals:**
- Move linting to ESLint flat config so the project can use ESLint 9 or 10 and `@angular-eslint@22`.
- Remove `eslint-config-airbnb-base` and rebuild the baseline from native flat-config-compatible ESLint, TypeScript ESLint, and Angular ESLint packages.
- Preserve the current explicit local rule set, ignore patterns, TypeScript overrides, Angular preferences, spec/mocks relaxations, import-rule choices, and HTML `max-lines` behavior.
- Add Angular ESLint's recommended template rules to the HTML lint baseline and resolve resulting template findings.
- Keep `npm run lint` and the husky/lint-staged `eslint --fix` workflow working.
- Remove the legacy `.eslintrc.json` after the flat config is verified.

**Non-Goals:**
- Do not introduce standalone component or `inject()` migrations; `@angular-eslint/prefer-standalone` and `@angular-eslint/prefer-inject` remain disabled.
- Do not enable Angular template accessibility rule sets unless they are part of Angular ESLint's recommended template baseline.
- Do not attempt strict rule-for-rule parity with Airbnb defaults that the project has not explicitly chosen.
- Do not fix unrelated lint violations, reformat the codebase, or refactor application code beyond changes needed for the new intentional lint baseline, including the added template recommended rules.
- Do not change build, test, runtime, or bundle behavior.

## Decisions

1. Use `eslint.config.js` as the single lint entrypoint.

   Flat config is the required configuration model for modern ESLint and is the only durable path before ESLint 10 removes `.eslintrc` support entirely. Keeping both configs would make the active rule source ambiguous, so `.eslintrc.json` should be deleted once parity is confirmed.

2. Remove Airbnb instead of bridging it with `FlatCompat`.

   Airbnb base remains an eslintrc-style shareable config and adds peer dependency friction to the ESLint 9/10 migration. The project already overrides many of its opinions, so the durable path is to remove `eslint-config-airbnb-base` and express the project's intentional rules directly.

3. Build the baseline from native flat-config-compatible sources.

   Use `@eslint/js`, `typescript-eslint`, and `@angular-eslint` flat-config-compatible exports where they provide useful syntax and framework checks. Layer explicit local rules afterward so project choices remain visible and are not hidden inside a legacy shareable config.

4. Port overrides structurally instead of flattening all rules into one block.

   The current config has distinct behavior for TypeScript files, specs, mocks, and HTML templates. Matching that structure in flat config makes parity easier to review and reduces the chance that relaxed test/mock limits or HTML parser behavior leak into the wrong files.

5. Add recommended Angular template linting deliberately.

   The existing HTML override only configures the Angular template parser/plugin and `max-lines`. The flat config migration should add Angular ESLint's recommended template rules as an intentional quality improvement while keeping template accessibility presets out of scope unless they are included by the recommended baseline. New HTML findings should be fixed where straightforward or documented if a rule needs a local exception.

6. Verify by comparing the lint baseline before and after dependency/config changes.

   The implementation should capture or observe the current `npm run lint` output, migrate dependencies/configuration, then rerun `npm run lint`. Differences caused by removing unowned Airbnb defaults or adding Angular template recommended rules are acceptable only when reviewed and documented; broad churn from accidentally enabling unrelated rule sets indicates a config mismatch.

## Risks / Trade-offs

- Removing Airbnb may drop legacy defaults that were implicitly relied on -> Mitigate by reviewing the pre-migration findings and explicitly adding back any rule that the project still wants.
- ESLint 9/10, `@angular-eslint@22`, or `@typescript-eslint@8` may report slightly different diagnostics than ESLint 8-era tooling -> Mitigate by identifying unavoidable version-driven differences explicitly and avoiding unrelated rule additions.
- Import plugin rules previously came mostly through Airbnb -> Mitigate by either removing `eslint-plugin-import` if no longer needed or configuring only the import rules the project intentionally keeps.
- Angular template recommended rules may surface real HTML issues across existing templates -> Mitigate by fixing straightforward issues during this change and documenting any rule-specific exceptions that are intentionally kept.
- Flat config ignore semantics differ from `.eslintrc` `ignorePatterns` -> Mitigate by porting ignore patterns into a top-level `ignores` block and verifying ignored files are not linted.
- Dependency installation may alter the lockfile broadly -> Mitigate by making only the lint-related package changes needed for peer compatibility.
