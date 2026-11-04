## MODIFIED Requirements

### Requirement: Behavior-preserving import
The in-repo communication layer SHALL expose at least the public API of the original `net7/pundit-communication` package (namespaces `annotation`, `notebook`, `social`, `auth`, `tag`, `comment`; `CommunicationSettings`; all exported model and request types), plus the `ai` and `ontology` namespaces added later, and SHALL perform the same HTTP requests (URL, method, base URL, headers, credentials, body) as `net7/pundit-communication@904a5d0` for the original endpoints. Changes to the imported source SHALL be limited to type-level fixes and lint fixes that do not alter runtime behavior.

#### Scenario: Same requests on the wire
- **WHEN** the client performs any communication call that existed in the original package (e.g. create annotation, search notebooks, login, SSO, refresh)
- **THEN** the HTTP request issued is identical to the one issued by the previous package version

#### Scenario: Known library defects are preserved
- **WHEN** the imported source contains a runtime defect (e.g. `refreshHook` reading `err.response.status` on response-less errors)
- **THEN** the defect is left unchanged in this change and recorded as a follow-up

#### Scenario: Ontology namespace
- **WHEN** application code needs the user's ontologies, to save their selection or to search their elements
- **THEN** it uses `ontology.list`, `ontology.saveSelection` or `ontology.searchElements` from `src/communication`
- **AND** each call targets `apiBaseUrl` with Bearer auth and the `refreshHook`, like `ai.annotate`
