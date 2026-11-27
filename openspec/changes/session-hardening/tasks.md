Tests: `npx jest <path>` on Node 20. A task marked "confirm first" starts from a spec of the expected behaviour; if it passes on the current code the report was wrong: keep the spec, skip the fix, note it in the change's design under D7.

## 1. Relay answers

- [x] 1.1 `doCrossMessageRequest.spec.ts`: a success is answered `{ status, data }` only; a body with `csrf_token` loses it; a failure is answered `{ response: { status, data } }` only; a failure without an answer has no `response`; a local operation of the worker is answered with its value unchanged (design D1)
- [x] 1.2 `doCrossMessageRequest.ts`: build both answers from `status` and `data`; leave `csrf_token` out of an object body; mark the local operations in the handler map and pass their value through
- [x] 1.3 Run `npx jest src/chrome-ext src/common` and the specs of `src/app` that read relayed answers; fix any caller that read another key

## 2. Worker addresses

- [x] 2.1 `webpack.chrome-ext.prod.js`, `webpack.chrome-ext.stage.js`: constant `AUTH_BASE_URL`, the value of `API_BASE_URL` without its trailing `api` (`https://host/api` gives `https://host/`, the shape of `authBaseUrl` in `local.example.ts`) (design D2)
- [x] 2.2 Specs: on start the worker's settings hold the two build addresses; a relayed request right after start goes to `API_BASE_URL`; an `InitCommunicationSettings` message changes nothing; `getApiOrigins()` gives the origin of `AUTH_BASE_URL` whatever the storage holds
- [x] 2.3 `background/main.ts`: set `CommunicationSettings.apiBaseUrl` and `authBaseUrl` from the constants
- [x] 2.4 `doCrossMessageRequest.ts`: no storage read before the request; `onContentScriptMessage.ts`: drop the `InitCommunicationSettings` case and the `apiBaseUrl || API_BASE_URL` fallback; `apiAccess.ts`: `getApiOrigins()` reads `AUTH_BASE_URL`, not the storage
- [x] 2.5 Content script: remove `onInitCommunicationSettings` and its entry in `listenersMap`; `initCommunicationSettings.ts`: the extension branch dispatches nothing; remove the two unused keys from `ChromeExtStorageKey`

## 3. Identifiers

- [x] 3.1 List, in the spec file, the relay operations whose model method puts an argument into a URL path (read `src/communication/**` for template paths). Found, always the first argument: annotation get/update/remove, notebook update/remove/setDefault/userInviteWithEmail (share)/userRemoveWithEmail (removeShare)/resendEmail (shareNotification), reply update/remove. Notebook get, reply get and social get have template paths but are not relayed
- [x] 3.2 Specs: a ULID, an identifier kept from the annotation server and a numeric id are sent; `../../user`, `abc?x=1`, an empty string and a 65-character value are answered 400 `Invalid identifier` with nothing sent (design D3)
- [x] 3.3 `doCrossMessageRequest.ts`: check the identifier argument of those operations before calling the model

## 4. Sender

- [x] 4.1 Specs: a message with a foreign `sender.id` or without `sender.tab` is ignored; a relay or image request from an inactive tab is neither sent nor answered; from an active tab it is served; on activation the state is stored before the content script is told to load (design D4)
- [x] 4.2 `onContentScriptMessage.ts`: the two checks; read the tab's state the way `checkActiveState.ts` does

## 5. Social sign-in

- [ ] 5.1 Specs: `login(provider)` opens exactly `provider.params.url`; `already_signed_in` yields `toast#login_already_signed_in_text` and no session lookup (design D5)
- [ ] 5.2 `oauth-provider.interface.ts`: `OAuthParameters` is `{ url: string }`; `oauth-provider.service.ts`: `createOAuthURL` returns the address unchanged
- [ ] 5.3 `transformer.helper.ts`: the new outcome; `en_US.ts`: the new string
- [ ] 5.4 `local.example.ts`: each provider's `url` is `` `${authBaseUrl}login/<provider>/pundit` ``; remove the client id, redirect and scope constants; `scripts/deploy/env-check.js` and its test: refuse a provider configuration that still has `clientId`

## 6. Reported defects, confirm first

- [ ] 6.1 Current notebook: spec that a rejected `NotebookModel.setDefault` restores the previous selection and shows the error toast; then subscribe in `notebook.service.ts` (design D7)
- [ ] 6.2 Feed redirect: spec that `handleFeedWeb` calls `chrome.tabs.update` with the id of the tab it was given; then pass `tab.id` in `checkActiveState.ts`
- [ ] 6.3 Refused edit: spec that when the update of an annotation is rejected the editor is open and holds the submitted text; then close it after the answer in `main-layout-edit-modal.handler.ts`

## 7. Close

- [ ] 7.1 `npx jest` whole, `npm run lint`, `npm run build:chrome-ext-stage`
- [ ] 7.2 By hand in the built extension against a BE API with the start route: sign in with a provider; sign in with a password; save, edit and delete an annotation; open a PDF; stop the service worker from the extensions page and save again at once
- [ ] 7.3 By hand: in the page's console dispatch a relay request for `annotation.get` with `../../user` → no network request from the worker; dispatch the communication settings event with another host → the next request still goes to the build's address; read a relayed answer → no `csrf_token`, no `config`
