## Context

`@pundit/communication` (repo `net7/pundit-communication`, branch `develop`) is the client's HTTP layer to the annotation server: ~40 thin endpoint wrappers (`annotation`, `notebook`, `reply`/`comment`, `social`, `tag`, `auth`) over a single axios-based `request$` provider, plus model/request/response types, two singletons (`CommunicationSettings`, `ConnectionManager`) and builder classes. It is installed via `git+ssh`, pinned in `package-lock.json` to `904a5d03bf6225737ec97cad41b3edee038436fd` (v1.10.1), and ships only compiled ES5 `dist/`.

A local clone at `../../pundit-communication` (relative to this repo) is checked out at exactly that commit: 87 `.ts` files, ~1.6k lines. Its `tsconfig` is `strict: false`; under `--strict` it reports 58 errors (47 × TS2564 in builder classes and the two singletons; 11 × TS2322/TS7006/TS7034/TS7005 in `auth/*`, mostly `token = null`). Its 12 mocha/chai/nock specs do not compile (they import a `src/user` module removed in 2021) and nock 13 cannot intercept the fetch adapter anyway.

Its runtime dependencies are `axios@0.26.1` (installed nested, while the client root has `axios@0.21.4`, used only for the `AxiosError` type in `transformer.helper.ts`) and `@vespaiach/axios-fetch-adapter@0.3.1`, required because the MV3 background service worker has no `XMLHttpRequest`. Its declared dependency on `@pundit/common` is never imported. `@pundit/common` itself is two type aliases (`Anchoring.TextPosition`, `Anchoring.TextQuoteSelector`) that the client never imports either.

Consumers in the client:
- 42 files import `@pundit/communication` (Angular app, `src/common/models`, `src/common/helpers`, chrome-ext background, the jest stub).
- Three pipelines must resolve it: Angular CLI (`tsconfig.json`, `baseUrl: './'`), the chrome-extension webpack build (`ts-loader` + `tsconfig.chrome-ext.json`, content and background bundles), and jest (`moduleNameMapper` to `src/testing/communication.mock.ts`, `modulePaths: ['<rootDir>']`).

## Goals / Non-Goals

**Goals:**
- Own the communication source in-repo under `src/communication/` with an unchanged public API.
- Remove `@pundit/communication` and `@pundit/common` from the dependency tree.
- Keep every build configuration and the unit test suite green.
- Bring the imported code under the client's `strict: true` and ESLint rules with type-level/lint-only edits.
- Add meaningful unit coverage where the layer has real logic (provider, refresh, SSO).

**Non-Goals:**
- No runtime behavior change, no API redesign, no singleton removal.
- No axios major upgrade or switch to native `fetch` / Angular `HttpClient`.
- No fix of known library defects (`refreshHook` on response-less errors, possible concurrent-refresh race) — follow-ups.
- No preservation of the library's git history in this repo.
- No action on the upstream GitHub repositories (archiving is a separate decision).

## Decisions

**Decision: Location `src/communication/`, layout copied verbatim.**
Sits beside `src/common/` and `src/app/`, both of which consume it. Keeping the library's internal layout (`annotation/`, `auth/`, `model/`, `providers/`, `services/`, …) keeps the diff against upstream readable and avoids touching internal relative imports. Alternative — `src/common/communication/` — rejected: `src/common` is already a mixed bag, and the layer is a distinct concern consumed by both app and extension.

**Decision: Import via the baseUrl specifier `src/communication`, rewrite all 42 imports.**
The app already uses baseUrl specifiers (`src/app/...` ×174, `src/common/...` ×30) and the repo has no `paths` aliases. Using one specifier everywhere, including `src/common` and chrome-ext files that otherwise use relative imports, is what lets jest's `moduleNameMapper` intercept it reliably. Alternatives — keep `@pundit/communication` as a `paths` alias (zero churn but misleadingly looks like an npm package, and adds a mechanism the repo doesn't use) or a new `@communication` alias (same mechanism cost) — rejected.

**Decision: Chrome-extension webpack resolves `src/...` via `resolve.modules`.**
`ts-loader` type-checks through `baseUrl`, but webpack's resolver needs the project root in `resolve.modules` (`[path.resolve(__dirname), 'node_modules']`) to bundle `src/communication`. The stage config maps over the prod config and inherits it. Alternative — `resolve.alias: { 'src': … }` — equivalent, but `resolve.modules` mirrors `baseUrl` semantics exactly.

**Decision: Flat copy with source SHA in the commit message.**
The code is copied from the local clone at `904a5d0` and the commit message records `net7/pundit-communication@904a5d0`. Alternative — `git subtree`/history merge — rejected: it pollutes `develop` history with commits unrelated to the client; upstream history remains in the original repository.

**Decision: Copy + adaptations + wiring land as one commit.**
The husky `lint-staged` pre-commit hook runs `eslint --fix` on staged `.ts` files, and an unwired verbatim copy would not pass strict type-check, so a pure verbatim commit is not cleanly achievable. One green commit is preferred over a reviewable-but-broken intermediate. Reviewers can diff `src/communication/` against the upstream clone to see the adaptations.

**Decision: Promote runtime deps; unify axios on `^0.26.1`.**
`axios` root bumps `^0.21.0` → `^0.26.1`, which is what the library already runs with, so runtime behavior is unchanged and the nested copy disappears. The only other root usage is the `AxiosError` type, stable across 0.21→0.26. `@vespaiach/axios-fetch-adapter@^0.3.1` becomes a direct dependency.

**Decision: Strict fixes follow the precedent of `typescript-strict-typechecking`.**
- TS2564 in builder classes and singletons: definite-assignment `!` (fields set by fluent setters / lazily), matching how the client fixed its own 139 TS2564.
- `token = null` (TS2322): widen `CommunicationSettings.token` to `AuthToken | null`. This is a type-level change that matches actual runtime use; the single client write (`onContentScriptMessage.ts`, `null as any`) keeps compiling and its cast becomes removable. Reads in `rest.provider.ts` are already guarded by `if (CommunicationSettings.token …)`.
- Implicit any in `refresh.ts`/`sso.ts`: annotate with `AxiosPromise`, `AxiosResponse`, `AxiosError`, `() => void`.
Errors that differ under the client's compiler settings (`moduleResolution: bundler`, `target: ES2022`, axios 0.26 types) are fixed under the same rule.

**Decision: Discard the old specs; write three focused jest specs.**
`providers/rest.provider.spec.ts`, `auth/refresh.spec.ts`, `auth/sso.spec.ts`, with `jest.mock('axios')` and `jest.mock('@vespaiach/axios-fetch-adapter')`, importing siblings by relative path so the stub mapping does not apply. The ~40 endpoint wrappers are declarative URL+method objects; testing each would be low-value.

**Decision: Jest stub mapping keyed on the new specifier.**
`moduleNameMapper` changes from `'^@pundit/communication$'` to `'^src/communication$'`. Because all client code uses that exact specifier, app specs keep receiving the stub; specs inside `src/communication/` use relative imports and get the real code.

## Risks / Trade-offs

- [ES5 → ES2022 compilation changes behavior] → The source uses plain classes, getters/setters and promises; with `useDefineForClassFields: false` (already set) class-field semantics match. Verified by builds plus manual extension smoke test.
- [axios 0.21 → 0.26 at root affects other code] → Only a type import uses root axios; `npm ls axios` must show a single 0.26.x after install.
- [Chrome-extension bundles silently resolve a stale copy] → After `npm install`, `node_modules/@pundit/communication` is gone, so any missed import fails the build loudly; additionally grep the built bundles.
- [A strict "fix" alters runtime] → Only `!`, type annotations and type widening; no initializers or guards added. Review diff against upstream clone.
- [`eslint --fix` rewrites code semantically] → Review the autofix diff; airbnb-style rules in upstream are close to the client's, expected changes are formatting/quotes.
- [Widening `token` to `AuthToken | null` cascades strict-null errors in the client] → Only one client write exists and no reads; verified by `tsc --noEmit` on all four tsconfig projects.
- [MV3 service worker transport regression] → Fetch adapter retained unchanged; manual smoke test of the stage extension covers background-originated requests.

## Migration Plan

1. Branch `refactor/inline-communication` from `develop`.
2. Copy source, rewrite imports, update deps and build config, fix strict/lint — one green commit.
3. Add the three specs — one commit.
4. Verify: `tsc --noEmit` on `tsconfig.json`/`tsconfig.app.json`/`tsconfig.chrome-ext.json`/`tsconfig.spec.json`, `npm run lint`, `npm test`, `npm run build`, `build:embed-stage`, `build:pdf-standalone-stage`, `build:chrome-ext-stage`; `npm ls`; grep bundles; manual extension smoke test by a developer.
5. Rollback: revert the branch merge; `package.json` restores the git dependencies and `npm install` re-fetches them (requires SSH access to GitHub, as today).

## Open Questions

- Should the upstream `pundit-communication` and `pundit-common` repositories be archived once this lands? (Out of scope; owner decision.)
- Does annotation-server rotate the refresh-token cookie on `/api/auth/refresh`? Determines whether the concurrent-refresh race is real (follow-up).
