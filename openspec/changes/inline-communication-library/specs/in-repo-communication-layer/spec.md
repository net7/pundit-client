## ADDED Requirements

### Requirement: No external Pundit communication packages
The client SHALL NOT depend on the `@pundit/communication` or `@pundit/common` packages. Its annotation-server HTTP layer SHALL live as TypeScript source under `src/communication/` and SHALL be compiled, type-checked and linted together with the rest of `src/`.

#### Scenario: Dependency tree is clean
- **WHEN** `npm ls @pundit/communication @pundit/common` is run after `npm install`
- **THEN** neither package is present in the dependency tree
- **AND** `package.json` lists neither package

#### Scenario: Build output has no reference to the old package
- **WHEN** any build configuration (default, `embed-*`, `pdf-standalone-*`, `chrome-ext-*`) completes
- **THEN** the emitted bundles contain no module resolved from `node_modules/@pundit/communication` or `node_modules/@pundit/common`

### Requirement: Single import specifier
Client code SHALL import the communication layer only through the baseUrl specifier `src/communication`, from every area of the codebase (Angular app, `src/common`, chrome-extension background).

#### Scenario: Importing from any area
- **WHEN** a file anywhere under `src/` (outside `src/communication/` itself) needs a communication API or type
- **THEN** it imports from `'src/communication'`
- **AND** no file imports from `'@pundit/communication'` or reaches into `src/communication/` internals by relative path

#### Scenario: Chrome-extension bundles resolve the specifier
- **WHEN** the chrome-extension webpack build bundles `content/main.ts` and `background/main.ts`
- **THEN** imports of `'src/communication'` resolve to `src/communication/index.ts` without error

### Requirement: Behavior-preserving import
The in-repo communication layer SHALL expose the same public API (namespaces `annotation`, `notebook`, `social`, `auth`, `tag`, `comment`; `CommunicationSettings`; all exported model and request types) and SHALL perform the same HTTP requests (URL, method, base URL, headers, credentials, body) as `net7/pundit-communication@904a5d0`. Changes to the imported source SHALL be limited to type-level fixes and lint fixes that do not alter runtime behavior.

#### Scenario: Same requests on the wire
- **WHEN** the client performs any communication call (e.g. create annotation, search notebooks, login, SSO, refresh)
- **THEN** the HTTP request issued is identical to the one issued by the previous package version

#### Scenario: Known library defects are preserved
- **WHEN** the imported source contains a runtime defect (e.g. `refreshHook` reading `err.response.status` on response-less errors)
- **THEN** the defect is left unchanged in this change and recorded as a follow-up

### Requirement: Fetch-based transport
The request provider SHALL send requests through axios with the `@vespaiach/axios-fetch-adapter` fetch adapter, so the layer works in the chrome-extension MV3 service worker where `XMLHttpRequest` is unavailable.

#### Scenario: Request from the background service worker
- **WHEN** the chrome-extension background service worker performs a communication call
- **THEN** the request is executed via `fetch` and completes without an `XMLHttpRequest`-related error

### Requirement: Unit tests stub the network layer
Application unit tests SHALL continue to receive the stub in `src/testing/communication.mock.ts` instead of the real communication layer, while the communication layer's own specs SHALL exercise the real source.

#### Scenario: App spec imports the communication layer
- **WHEN** an application spec (or code under test) imports `'src/communication'`
- **THEN** jest resolves it to `src/testing/communication.mock.ts`

#### Scenario: Communication spec imports its own source
- **WHEN** a spec under `src/communication/` imports a sibling module by relative path
- **THEN** jest loads the real module, not the stub

### Requirement: Request provider and auth flows are covered by unit tests
The request provider and the auth token flows SHALL have jest specs, with axios and the fetch adapter mocked, covering their branching logic.

#### Scenario: Authorization header
- **WHEN** `CommunicationSettings.token` is set and a request is made without `skipAuth`
- **THEN** the request carries `Authorization: Bearer <access_token>`
- **AND** no `Authorization` header is sent when the token is unset or `skipAuth` is true

#### Scenario: Requests wait for an in-flight SSO
- **WHEN** an SSO request is in flight (`ConnectionManager.ssoLoading$` pending)
- **THEN** other requests are not sent until it settles
- **AND** the SSO request itself is not blocked by its own gate

#### Scenario: After hook and retry
- **WHEN** a request declares `hooks.after`
- **THEN** the hook receives the response promise and its result is returned
- **AND** `retry$` re-sends the failed request config with the current token

#### Scenario: Token refresh on 401
- **WHEN** a request wrapped by `refreshHook` fails with HTTP 401
- **THEN** the token is refreshed, stored in `CommunicationSettings.token`, and the original request is retried
- **AND** if the refresh fails the token is cleared and the error is rethrown
- **AND** errors with any other status are rethrown unchanged

#### Scenario: SSO token handling
- **WHEN** `auth.sso()` succeeds
- **THEN** the returned token is stored in `CommunicationSettings.token`
- **AND** on failure the token is cleared and the error is rethrown
- **AND** in both cases the `ssoLoading$` gate is released
