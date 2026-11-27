## Why

With the new BE API the session cookie is the only credential: whatever can make the client send a request acts as the signed-in user. Two places in the client let something other than the user do that. In the extension, the annotated page shares a message channel with the background service worker, and the worker hands back more than the page needs. In the social sign-in, the client builds the provider's address itself, so nothing ties the answer to the browser that asked.

A review of the session flow also reported four smaller defects that this change confirms and fixes.

## What Changes

- **Extension, background worker.** A relayed answer carries only `status` and `data`, and never the CSRF token. The worker's API addresses come from the build, not from a message of the page. An identifier that would become part of a URL path is checked before the request is built. A relay request is served only for a tab where the user switched Pundit on, and only from this extension.
- **BREAKING (configuration)** Social sign-in opens a route of the new BE API (`<authBaseUrl>login/{provider}/pundit`). The provider's client id, redirect URI and scope leave the client's configuration.
- The popup's new outcome `already_signed_in` shows its own message.
- Changing the current notebook reports a failure and restores the previous selection.
- The feed redirect of the extension navigates the tab it was decided for.
- An annotation edit that the server refuses stays open in the editor.

## Capabilities

### New Capabilities

- `extension-request-relay`: what the background worker accepts from a page, what it sends for it, and what it hands back.
- `social-sign-in-start`: how the client starts a social sign-in and reads its outcome.

### Modified Capabilities

None. The session flow of `be-api-session` is unchanged: cookie on every request, CSRF header on every write, one retry on 419.

## Impact

- Extension background: `doCrossMessageRequest.ts`, `onContentScriptMessage.ts`, `checkActiveState.ts`, `apiAccess.ts`, `main.ts`; `webpack.chrome-ext.{stage,prod}.js` (a new build constant).
- Extension site access page: `site-access/main.ts` asks for the build's origin.
- Extension content script: the handler that forwarded the communication settings goes.
- Shared code, behaviour unchanged for the embed build: `src/common/helpers/initCommunicationSettings.ts`.
- Login module: `oauth-provider.service.ts`, `oauth-provider.interface.ts`, `transformer.helper.ts`, `configuration.service.ts` (its fallback providers); `src/environments/local.example.ts`; one i18n string.
- App: `notebook.service.ts`, `main-layout-edit-modal.handler.ts`.
- New BE API: needs the sign-in start route and the `already_signed_in` outcome. A build from this change cannot sign in with a provider against a BE API that lacks them.
- Whoever generates `local.stage.ts` for a deployment has to emit the new provider settings.
- Out of scope: moving the app out of the page's JavaScript world; moving notebook sharing, notebook deletion or the password sign-in out of the relay; coordinating requests around a sign-in; telling other tabs that the account changed; retrying after 429; a time limit on relayed calls (deferred by the owner).
