## 1. Baseline Sass Deprecations

- [x] 1.1 Ensure Node 22.22.3 is active with `fnm` and dependencies are installed.
- [x] 1.2 Run `npm run build` with the current `silenceDeprecations` configuration and confirm the build baseline is otherwise healthy.
- [x] 1.3 Temporarily inspect or remove the Sass `silenceDeprecations` entries locally to capture the current project-owned `@import`, `global-builtin`, and `color-functions` warnings.
- [x] 1.4 Inventory all active project-owned `@import`, `lighten()`, `darken()`, and `desaturate()` usages in `angular.json`, `src/styles/`, `src/app/app.component.scss`, and `src/app/login-module/`.

## 2. Migrate Sass Module Imports

- [x] 2.1 Run `npx sass-migrator module --migrate-deps` for `src/styles/styles.scss` and review the generated `@use` and `@forward` changes.
- [x] 2.2 Run `npx sass-migrator module --migrate-deps` for the login module style entrypoint and review the generated `@use` and `@forward` changes.
- [x] 2.3 Fix any variable, mixin, or namespace references that no longer resolve after Sass module scoping.
- [x] 2.4 Preserve the existing top-level Google Fonts, Tippy, and Tagify CSS inclusion behavior so package and remote styles remain valid.
- [x] 2.5 Confirm component styles no longer use deprecated Sass `@import` for project-owned SCSS dependencies.

## 3. Migrate Color Functions

- [x] 3.1 Replace active global `lighten()`, `darken()`, and `desaturate()` calls in the shared style tree with `sass:color` APIs.
- [x] 3.2 Replace active global color function calls in the login module style tree with `sass:color` APIs.
- [x] 3.3 Review each color replacement for visual equivalence, preferring `color.adjust()` when it best matches the old Sass behavior.
- [x] 3.4 Leave commented-out legacy examples untouched only if they do not trigger Sass deprecation warnings, or update comments if they are misleading.

## 4. Remove Warning Suppression

- [x] 4.1 Remove `import`, `global-builtin`, and `color-functions` from `stylePreprocessorOptions.sass.silenceDeprecations` in `angular.json`.
- [x] 4.2 Remove the empty Sass `silenceDeprecations` configuration object entirely if no deprecation suppressions remain.
- [x] 4.3 Re-scan project-owned SCSS to confirm no active deprecated Sass `@import` or global color function calls remain.

## 5. Verify Builds and Styling

- [x] 5.1 Run `npm run build` and confirm it completes without project-owned Sass deprecation warnings.
- [x] 5.2 Run `npm run build:embed-prod` and confirm the single-file embed bundle still builds.
- [x] 5.3 Run `npm run build:chrome-ext-prod` and confirm the extension bundle still builds.
- [x] 5.4 Inspect the built CSS or run a focused browser smoke check to confirm main app, Tagify, Tippy, and login module styles are still present.
- [x] 5.5 Review the final diff to ensure changes are limited to Sass migration, Angular style preprocessor configuration, and any necessary style-equivalence corrections.
