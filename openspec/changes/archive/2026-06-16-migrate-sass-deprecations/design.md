## Context

The Angular 22 build currently uses Dart Sass through the Angular application builder. The build is clean only because `angular.json` silences the `import`, `global-builtin`, and `color-functions` Sass deprecations under `stylePreprocessorOptions.sass.silenceDeprecations`.

The current SCSS still contains two deprecated patterns. The main style entrypoint, `src/styles/styles.scss`, imports project partials and third-party Tagify styles with `@import`. The login module has a parallel import entrypoint at `src/app/login-module/styles/_import.scss`, consumed from `pundit-login.component.scss`. There are also component-level stylesheet imports in `src/app/app.component.scss` and `src/app/login-module/lib/pundit-login-module/pundit-login.component.scss`, plus global color function calls in the shared and login style trees.

Sass module migration changes scoping: variables and mixins are no longer globally visible across files unless explicitly exposed with `@use` or `@forward`. The implementation therefore needs to preserve current cascade order and generated CSS while replacing deprecated syntax.

## Goals / Non-Goals

**Goals:**
- Remove reliance on Sass deprecation silencing for `@import`, global built-ins, and global color functions.
- Migrate project SCSS entrypoints and dependent partials to Sass modules using `@use` and `@forward`.
- Replace global color functions with `sass:color` APIs while preserving visual intent.
- Preserve existing stylesheet order, ShadowDom host behavior, third-party CSS inclusion, and login module styling.
- Verify builds compile without Sass deprecation warnings after `silenceDeprecations` is removed.

**Non-Goals:**
- Do not redesign the visual system or normalize the duplicated shared/login style trees beyond what the migration requires.
- Do not replace Tagify, Tippy, Google Fonts, or other third-party stylesheet dependencies.
- Do not move the Angular app away from ShadowDom style encapsulation or alter custom element bootstrapping.
- Do not address unrelated Sass or CSS cleanup that is not needed to remove the silenced deprecations.

## Decisions

1. Use Sass migrator as the starting point, then review manually.

   `sass-migrator module --migrate-deps` can perform the broad `@import` to `@use` conversion and introduce namespaces consistently. Because this codebase relies on ordered partials and component-hosted imports, the result needs manual review rather than blind acceptance.

2. Treat `styles.scss` and the login module import file as separate entrypoints.

   The app and login module have separate style trees with similar but not identical files. Migrating both entrypoints prevents the main build from being clean while the login component still depends on deprecated imports.

3. Preserve CSS import ordering for remote and package styles.

   Existing comments note that Google Fonts and package CSS imports must remain top-level to avoid invalid nested CSS `@import` output inside `:host`. The migration should keep those plain CSS imports where Sass requires them and use Sass modules only for SCSS-controlled files.

4. Prefer explicit Sass namespaces over reintroducing globals.

   The durable module form is to reference variables, mixins, and functions through namespaces, or to provide small forwarding files where that matches the current entrypoint structure. `as *` should be reserved for cases where it is necessary to keep a broad partial tree maintainable during this migration.

5. Use `sass:color` replacements intentionally.

   Global `lighten()`, `darken()`, and `desaturate()` calls should become `color.adjust()` or another `sass:color` API. The implementer should check cases where migrator output uses `color.scale()`, because it is not always an exact visual match for the old function.

6. Remove deprecation silencing only after the SCSS is migrated.

   The `silenceDeprecations` entries in `angular.json` are the proof that deprecated features are currently hidden. They should be removed once builds are clean so future Sass deprecations surface during normal development.

## Risks / Trade-offs

- Sass module scoping can break variables or mixins that were previously global -> Mitigate by migrating with dependencies, reviewing namespace changes, and rebuilding each affected Angular configuration.
- Generated CSS order can change when imports become modules -> Mitigate by keeping entrypoint ordering explicit and checking visual or CSS output differences for shared and login styles.
- Third-party CSS imports can become invalid if nested under `:host` -> Mitigate by preserving the existing top-level CSS import pattern documented in the component stylesheets.
- `color.scale()` suggestions may not match legacy `lighten()` or `darken()` output -> Mitigate by choosing `color.adjust()` where exact legacy channel adjustment is required.
- Removing `silenceDeprecations` may expose deprecations from third-party packages -> Mitigate by distinguishing project-owned SCSS from package CSS/SCSS and documenting any dependency-owned warning that cannot be fixed locally.
