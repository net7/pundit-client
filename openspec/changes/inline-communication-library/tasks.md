## 1. Baseline

- [ ] 1.1 Create branch `refactor/inline-communication` from `develop`
- [ ] 1.2 Confirm the local clone `../../pundit-communication` is at `904a5d03bf6225737ec97cad41b3edee038436fd` with a clean working tree (matches the `package-lock.json` pin)
- [ ] 1.3 Record a green baseline: `tsc --noEmit -p` on `tsconfig.json`, `tsconfig.app.json`, `tsconfig.chrome-ext.json`, `tsconfig.spec.json`; `npm run lint`; `npm test`; `npm run build:chrome-ext-stage` (includes `embed-stage`); `npm run build:pdf-standalone-stage`

## 2. Import source

- [ ] 2.1 Copy `../../pundit-communication/src/**` into `src/communication/` (exclude `tests/`, `dist/`, config files), layout unchanged
- [ ] 2.2 Rewrite all `from '@pundit/communication'` imports under `src/` (42 files, including `src/testing/communication.mock.ts` doc comment) to `from 'src/communication'`; verify `grep -rn "@pundit/communication" src` returns nothing

## 3. Dependencies and build wiring

- [ ] 3.1 In `package.json`: remove `@pundit/communication` and `@pundit/common`; change `axios` to `^0.26.1`; add `@vespaiach/axios-fetch-adapter` `^0.3.1`
- [ ] 3.2 Run `npm install`; verify `npm ls @pundit/communication @pundit/common` is empty and `npm ls axios` shows a single 0.26.x
- [ ] 3.3 Add `resolve.modules: [path.resolve(__dirname), 'node_modules']` to the shared config in `webpack.chrome-ext.prod.js`; confirm the stage config inherits it
- [ ] 3.4 In `jest.config.js`, change the stub mapping key to `'^src/communication$'`; update the comments in `jest.config.js` and `src/testing/communication.mock.ts`

## 4. Strict and lint adaptations

- [ ] 4.1 Run `tsc --noEmit -p tsconfig.json` and list errors under `src/communication/`
- [ ] 4.2 Fix TS2564 in builder classes and singletons with definite-assignment `!`
- [ ] 4.3 Widen `CommunicationSettings.token` getter/setter/backing field to `AuthToken | null`; fix the `token = null` TS2322 errors in `auth/*`
- [ ] 4.4 Annotate implicit-any parameters/variables in `auth/refresh.ts` and `auth/sso.ts`; fix any remaining errors introduced by the client's compiler settings with type-level changes only
- [ ] 4.5 Run `npx eslint --fix "src/communication/**/*.ts"`, review the autofix diff, fix remaining lint errors by hand
- [ ] 4.6 Diff `src/communication/` against `../../pundit-communication/src/` and confirm every change is type-level or formatting (no initializers, guards or logic added)
- [ ] 4.7 Verify `tsc --noEmit` is clean on all four tsconfig projects and `npm run lint` passes
- [ ] 4.8 Commit: copy + imports + deps + wiring + fixes, message citing `net7/pundit-communication@904a5d0`

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
