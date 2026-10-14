## Why

The client's whole HTTP layer to the annotation server lives in a separate repository, `net7/pundit-communication`, consumed as a `git+ssh` npm dependency that ships only compiled ES5 `dist/` output. The library is effectively owned only by this client, its own test suite has been broken since 2021, it compiles with `strict: false` while the client is now fully strict, and every change to it requires a cross-repo release dance. `@pundit/common`, pulled in alongside it, contains two type aliases that nothing imports. Bringing the source in-repo makes the networking layer reviewable, type-checked and linted with the rest of the client, and drops two SSH-only git dependencies from `npm install`.

## What Changes

- Copy the TypeScript source of `net7/pundit-communication@904a5d0` (the commit currently pinned in `package-lock.json`, v1.10.1) into `src/communication/`, preserving its folder layout and public API 1:1.
- Rewrite the 42 client imports of `@pundit/communication` to the baseUrl specifier `src/communication`.
- Remove the `@pundit/communication` and `@pundit/common` dependencies from `package.json`.
- Promote the library's runtime dependencies to direct client dependencies: bump `axios` from `^0.21.0` to `^0.26.1` (the version the library already runs on) and add `@vespaiach/axios-fetch-adapter` `^0.3.1`.
- Wire the new specifier into the chrome-extension webpack build (`resolve.modules`) and the jest stub mapping (`moduleNameMapper`).
- Apply type-level-only fixes so the imported code passes the client's `strict: true` and ESLint configuration.
- Discard the library's dead mocha/nock specs; add focused jest specs for the request provider and the auth refresh/SSO flows.
- No runtime behavior change: same endpoints, headers, auth/refresh semantics and exported names.

## Capabilities

### New Capabilities
- `in-repo-communication-layer`: The client owns its annotation-server HTTP layer as in-repo source under `src/communication`, with no external `@pundit/communication`/`@pundit/common` packages, identical runtime behavior, and unit coverage of the request provider and auth token flows.

### Modified Capabilities

## Impact

- New code: `src/communication/**` (~87 files, ~1.6k lines) plus 3 spec files.
- Affected code: 42 files importing `@pundit/communication` across `src/app`, `src/common/models`, `src/common/helpers`, `src/chrome-ext/src/background`, and `src/testing/communication.mock.ts`.
- Affected configuration: `package.json` / `package-lock.json`, `webpack.chrome-ext.prod.js` (inherited by the stage config), `jest.config.js`.
- Affected builds: default Angular build, `embed-*`, `pdf-standalone-*`, and `chrome-ext-*` (Angular + webpack content/background bundles).
- Dependencies: removes two `git+ssh` packages; `@pundit/icon-font` remains the only `git+ssh` dependency.
- Out of scope, tracked as follow-ups: the `refreshHook` crash on response-less errors (`err.response` undefined), possible concurrent-refresh race, axios 1.x / native fetch migration, archiving the `pundit-communication` and `pundit-common` GitHub repositories.
