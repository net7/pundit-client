## MODIFIED Requirements

### Requirement: Single import specifier
Client code SHALL import the communication layer only through the baseUrl specifier `src/communication`, from every area of the codebase (Angular app, `src/common`, chrome-extension background). Client code outside `src/communication` SHALL NOT call the annotation backend directly (e.g. with `fetch` or `axios`); every backend API call SHALL go through the communication layer.

#### Scenario: Importing from any area
- **WHEN** a file anywhere under `src/` (outside `src/communication/` itself) needs a communication API or type
- **THEN** it imports from `'src/communication'`
- **AND** no file imports from `'@pundit/communication'` or reaches into `src/communication/` internals by relative path

#### Scenario: Chrome-extension bundles resolve the specifier
- **WHEN** the chrome-extension webpack build bundles `content/main.ts` and `background/main.ts`
- **THEN** imports of `'src/communication'` resolve to `src/communication/index.ts` without error

#### Scenario: No direct backend calls
- **WHEN** application code needs to call an annotation-backend endpoint
- **THEN** it uses a function exported by `src/communication` (through its model/service)
- **AND** no `fetch` call to the annotation backend exists outside `src/communication`

### Requirement: Behavior-preserving import
The in-repo communication layer SHALL expose at least the public API of the original `net7/pundit-communication` package (namespaces `annotation`, `notebook`, `social`, `auth`, `tag`, `comment`; `CommunicationSettings`; all exported model and request types), plus the `ai` namespace added later, and SHALL perform the same HTTP requests (URL, method, base URL, headers, credentials, body) as `net7/pundit-communication@904a5d0` for the original endpoints. Changes to the imported source SHALL be limited to type-level fixes and lint fixes that do not alter runtime behavior.

#### Scenario: Same requests on the wire
- **WHEN** the client performs any communication call that existed in the original package (e.g. create annotation, search notebooks, login, SSO, refresh)
- **THEN** the HTTP request issued is identical to the one issued by the previous package version

#### Scenario: Known library defects are preserved
- **WHEN** the imported source contains a runtime defect (e.g. `refreshHook` reading `err.response.status` on response-less errors)
- **THEN** the defect is left unchanged in this change and recorded as a follow-up
