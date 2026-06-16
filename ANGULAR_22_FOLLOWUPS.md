# Angular 22 upgrade — follow-ups

The client was upgraded from Angular 17 → 22 (branch `chore/angular-22-upgrade`).
This file tracks the work that was **deliberately deferred** so it can be done
incrementally in separate sessions. Each item is self-contained: context, why it
was deferred, and concrete steps.

## Current baseline (after the upgrade)

| Thing | Version |
|---|---|
| Node | 22.22.3 (`.node-version`, `engines`) |
| `@angular/*` | 22.0.x |
| TypeScript | 6.0.x |
| `@net7/core` | 4.1.0 |
| Build | `@angular-devkit/build-angular:application` (esbuild) — ngx-build-plus removed |
| Tests | jest 30 + jest-preset-angular 17 |
| Lint | **eslint 8.57** + `@angular-eslint` 20 + `@typescript-eslint` 8 (pinned back — see item 1) |

How to run the toolchain (Node is managed by fnm, not active by default in a new shell):

```bash
eval "$(fnm env --shell bash)" && fnm use 22.22.3
npm ci
npm run build                 # default app build
npm run build:embed-prod      # single-file embed bundle (auto-runs postbuild)
npm run build:chrome-ext-prod # extension bundle (embed + webpack bg/content + postbuild)
npm test                      # jest
npm run lint                  # eslint
```

The single-bundle pipeline now relies on the esbuild builder emitting
`main.js` + `polyfills.js` + `styles.css` into a flat `dist/<ctx>/`, which
`scripts/postbuild.js` merges (IIFE-wrapping each esbuild bundle) into one
`pundit.embed.js` / `pundit.chrome-ext.js`.

---

## 1. Migrate ESLint to v9/10 + flat config

**Priority: high (eslint 8 is end-of-life).**

**Context.** `@angular-eslint@22` requires eslint `^9 || ^10`, and eslint 10
drops `.eslintrc` support entirely (flat config only). During the upgrade the
`ng update --force` bumped the eslint stack to 22 / eslint 10, which broke the
legacy `.eslintrc.json` (airbnb-base is eslintrc-format). To keep the upgrade
focused, the lint stack was **pinned back** to the eslint-8 generation
(`eslint@^8.57`, `@angular-eslint@^20`, `@typescript-eslint@^8`), which lints
the Angular 22 code fine via the existing `.eslintrc.json`.

**Why deferred.** Flat-config migration is a sizable, orthogonal effort:
airbnb-base has no official flat config, so it needs `@eslint/eslintrc`'s
`FlatCompat`, and the custom rule set (`complexity`, `max-lines`,
`max-lines-per-function`, template `max-lines`, the disabled
`prefer-standalone` / `prefer-inject`, the `*.spec.ts` / mocks / `*.html`
overrides) all has to be ported and re-verified.

**Steps.**
1. `npm i -D eslint@^9 @angular-eslint/*@^22 @typescript-eslint/*@^8` (typescript-eslint 8 already in place).
2. Create `eslint.config.js` (flat). Use `FlatCompat` from `@eslint/eslintrc`
   to wrap `airbnb-base`, or move off airbnb to
   `@typescript-eslint` recommended + a hand-picked rule set.
3. Port every block from `.eslintrc.json`:
   - the base `*.ts` rules (incl. `complexity: 10`, `max-lines: 300`,
     `max-lines-per-function: 100`, the swapped `@typescript-eslint/*` variants),
   - `@angular-eslint/prefer-standalone` and `prefer-inject` kept **off**
     (this app is intentionally NgModule + constructor-DI),
   - the `*.spec.ts` override (jest env, size rules off),
   - the mocks override (`src/app/mocks/**`, `src/**/*.mock.ts`),
   - the `*.html` override (`@angular-eslint/template` parser + plugin,
     template `max-lines: 200`; NOT the recommended/accessibility rulesets).
4. Delete `.eslintrc.json`; update the `lint` script if needed (flat config is auto-detected).
5. Verify `npm run lint` produces the **same** findings as today, then unpin eslint in `package.json`.
6. Confirm the husky/lint-staged pre-commit hook still runs `eslint --fix`.

---

## 2. Sass deprecations (`@import`, `lighten()`) — currently SILENCED

**Priority: medium (silenced now; will be fatal in Dart Sass 3.0).**

**Context.** The newer Dart Sass emits deprecation warnings:
- `@import` rules are deprecated (use `@use` / `@forward`),
- global color functions (`lighten()` / `darken()` / `desaturate()`) are
  deprecated (use `color.adjust` / `color.scale`).

These are **silenced** in `angular.json` via
`stylePreprocessorOptions.sass.silenceDeprecations: ["import", "global-builtin", "color-functions"]`
so the build/serve output is clean. This only hides them — the underlying SCSS
still needs migrating before Dart Sass 3.0 removes these features (at which point
the silenced deprecations become hard errors).

**Why deferred.** The `@import` → `@use` migration changes module scoping (no more
global access to variables/mixins), so it touches every partial and needs care.

**Steps.**
1. `@import`: run `npx sass-migrator module --migrate-deps src/styles/styles.scss`
   (and the login-module styles entrypoint). Review the `@use` namespacing it
   introduces; fix any now-out-of-scope variable/mixin references.
2. `lighten()` etc.: `npx sass-migrator color --migrate-deps <entrypoints>`, or
   hand-replace with `color.adjust($c, $lightness: …)` / `color.scale(...)`.
   Check the rendered colors are unchanged (the migrator's `scale` suggestion is
   not always identical to the old `lighten`).
3. Remove the `silenceDeprecations` entries from `angular.json`'s
   `stylePreprocessorOptions` so any *new* deprecations surface again.
4. Rebuild; confirm the deprecation warnings are gone and styles look identical.

(Note: the earlier slash-division deprecation was already handled — commit `1b2c0af`.)

---

## 3. Runtime smoke test of the bundles

**Priority: high before any release.**

**Context.** The upgrade verified: default build, all three single-file bundles
build + merge + pass `node --check`, jest (8/8), lint. It did **not** verify the
artifacts actually boot in a browser — the custom-element embed and the
extension were validated for syntax/structure, not runtime.

**Steps.**
1. `npm run build:chrome-ext-prod`, then load `dist/chrome-ext-prod` as an
   unpacked extension in Chrome. Exercise: create a tag annotation, edit it, add
   a comment, save (the regression fixed in `3f12629`), social actions, the PDF
   viewer path.
2. Sanity-check the embed widget (`dist/embed-prod/pundit.embed.js`) on a host page.
3. Watch for: zone.js double-patching (polyfills are now a separate esbuild
   bundle IIFE-wrapped ahead of main), ShadowDom style injection
   (`pundit-host-styles`), and the public API global from `pundit-api`.

---

## 4. Review `ChangeDetectionStrategy.Eager` on `social-action-bar`

**Priority: low.**

**Context.** The Angular 22 `ng update` added
`changeDetection: ChangeDetectionStrategy.Eager` to **only**
`src/app/components/annotation/sections/social/social-action-bar/social-action-bar.ts`
(a behavior-preservation migration). It was kept as-is.

**Steps.** Confirm this is intended (i.e. the component relies on eager change
detection) and decide whether other components want the same, or whether the
v22 default is fine here and the explicit setting can be dropped.

---

## 5. Consider re-enabling TypeScript `strict`

**Priority: low / large.**

**Context.** TypeScript 6 defaults `strict: true`. This project has always been
non-strict, so `strict: false` was set explicitly in `tsconfig.json` and
`tsconfig.chrome-ext.json` to preserve behavior. Turning strict on surfaced
600+ errors (implicit any, strict null, uninitialized properties).

**Steps (incremental).** Enable one flag at a time and fix the fallout:
`noImplicitAny` → `strictNullChecks` → `strictPropertyInitialization` → full
`strict`. This is a real code-quality project, not a quick win.

---

## 6. Other deferred / latent items

- **`@angular-devkit/build-angular` is still a devDep** only for the `extract-i18n`
  and `e2e` (protractor) targets. `build` and `serve` now use `@angular/build`
  directly. If those legacy targets are dropped, `@angular-devkit/build-angular`
  can be removed entirely.
- **`tsconfig` `baseUrl` + `ignoreDeprecations: "6.0"`.** `baseUrl` is deprecated
  in TS and removed in TS 7. Before a TS 7 bump, migrate absolute `src/...`
  imports to explicit `paths` mappings (or relative imports) and drop `baseUrl`.
- **`ts-loader@8` + `target: es2020`** in the chrome-ext webpack build is old
  (2021). It works with TS 6 after the tsconfig fixes, but bumping to
  `ts-loader@9` is advisable when touching that pipeline.
- **Old runtime deps untouched by the Angular bump** that may want attention
  eventually: `axios@0.21`, `pdfjs-dist@2.5`, `document-register-element`
  (custom-elements polyfill — likely unnecessary in modern Chrome),
  `protractor` (dead e2e tooling, still in devDeps).
- **History note:** the v19 commit (`9663d94`) captured a transient state where
  `eslint --fix` had stripped `standalone: false`; fully restored in the v20
  commit (`e206fd9`). The branch tip is correct; individual mid-branch commits
  are not all bisect-clean.
