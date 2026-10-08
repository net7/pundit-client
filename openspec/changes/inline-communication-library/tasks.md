## 1. Baseline

- [x] 1.1 Create branch `refactor/inline-communication` from `develop`
- [x] 1.2 Confirm the local clone `../../pundit-communication` is at `904a5d03bf6225737ec97cad41b3edee038436fd` (matches the `package-lock.json` pin). Working tree is NOT clean: uncommitted `skipAuth: true` in `src/auth/sso.ts` (+ rebuilt `dist/auth/sso.js`); the installed package equals the committed `dist`, so the source is taken from the commit via `git archive`, not from the working tree. The uncommitted change is recorded as a follow-up.
- [x] 1.3 Record a green baseline (Node v22.22.3 per `.node-version`): `tsc --noEmit -p` → `tsconfig.app.json`/`tsconfig.chrome-ext.json`/`tsconfig.spec.json` 0 errors, `tsconfig.json` 2 pre-existing TS2307 (`./local.prod` is a gitignored, locally absent env file; unrelated); `npm run lint` clean; `npm test` 21 suites pass; `npm run build`, `build:chrome-ext-stage` (incl. `embed-stage` + webpack content/background), `build:pdf-standalone-stage` all pass. Builds bump `scripts/.stage.version`; revert it before committing.

## 2. Import source

- [x] 2.1 Copy `../../pundit-communication/src/**` into `src/communication/` (exclude `tests/`, `dist/`, config files), layout unchanged
- [x] 2.2 Rewrite all `from '@pundit/communication'` imports under `src/` (42 files, including `src/testing/communication.mock.ts` doc comment) to `from 'src/communication'`; verify `grep -rn "@pundit/communication" src` returns nothing

## 3. Dependencies and build wiring

- [x] 3.1 In `package.json`: remove `@pundit/communication` and `@pundit/common`; change `axios` to `^0.26.1`; add `@vespaiach/axios-fetch-adapter` `^0.3.1`
- [x] 3.2 Run `npm install`; verify `npm ls @pundit/communication @pundit/common` is empty and `npm ls axios` shows a single 0.26.x
- [x] 3.3 Add `resolve.modules: [path.resolve(__dirname), 'node_modules']` to the shared config in `webpack.chrome-ext.prod.js`; confirm the stage config inherits it
- [x] 3.4 In `jest.config.js`, change the stub mapping key to `'^src/communication$'`; update the comments in `jest.config.js` and `src/testing/communication.mock.ts`

## 4. Strict and lint adaptations

- [x] 4.1 Run `tsc --noEmit -p tsconfig.json` and list errors under `src/communication/`
- [x] 4.2 Fix TS2564 in builder classes and singletons with definite-assignment `!`
- [x] 4.3 Widen `CommunicationSettings.token` getter/setter/backing field to `AuthToken | null`; fix the `token = null` TS2322 errors in `auth/*`
- [x] 4.4 Annotate implicit-any parameters/variables in `auth/refresh.ts` and `auth/sso.ts`; fix any remaining errors introduced by the client's compiler settings with type-level changes only
- [x] 4.5 Run ESLint on `src/communication/**/*.ts`: 5 findings, all stale directives (no autofix needed) — `no-empty-interface` disables replaced by `eslint-disable-next-line @typescript-eslint/no-empty-object-type` in `model/entity/user.ts`; unused `no-use-before-define` disable removed from `types.ts`
- [x] 4.6 Diff `src/communication/` against `../../pundit-communication/src/` and confirm every change is type-level or formatting (no initializers, guards or logic added)
- [x] 4.7 Verify `tsc --noEmit` is clean on all four tsconfig projects and `npm run lint` passes
- [x] 4.8 Commit: copy + imports + deps + wiring + fixes, message citing `net7/pundit-communication@904a5d0`

## 5. Specs

- [ ] 5.1 Add `src/communication/providers/rest.provider.spec.ts` (axios and fetch adapter mocked): Bearer header with token; no header without token or with `skipAuth`; waits for pending `ssoLoading$`; not blocked when `agent$ === ssoLoading$`; `hooks.after` applied; `retry$` re-sends config with current token
- [ ] 5.2 Add `src/communication/auth/refresh.spec.ts`: 401 → refresh, token stored, retry; refresh failure → token `null`, error rethrown; non-401 → rethrown unchanged
- [ ] 5.3 Add `src/communication/auth/sso.spec.ts`: success stores token; failure clears token and rethrows; `ssoLoading$` released in both cases
- [ ] 5.4 Run `npm test`; confirm existing app specs still receive the stub and the new specs load real modules
- [ ] 5.5 Commit the specs

## 6. Verification

- [ ] 6.1 `npm run lint`, `npm test`, `tsc --noEmit` on all four tsconfig projects
- [ ] 6.2 Builds: `npm run build`, `npm run build:chrome-ext-stage`, `npm run build:pdf-standalone-stage`
- [ ] 6.3 Grep `dist/` bundles to confirm no reference to `@pundit/communication` or `@pundit/common`
- [ ] 6.4 Manual smoke test (developer) on the stage chrome extension: SSO login, create/edit/delete annotation, notebook create/share, reply and like, behavior after token expiry (401 → refresh)
- [ ] 6.5 Record follow-ups in `ANGULAR_22_FOLLOWUPS.md` or the tracker: `refreshHook` `err.response` undefined crash; concurrent-refresh race investigation; remove the now-unneeded `null as any` cast in `onContentScriptMessage.ts`; archive upstream repositories
