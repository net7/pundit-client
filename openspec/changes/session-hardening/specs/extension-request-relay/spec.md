## ADDED Requirements

### Requirement: A relayed answer carries status and body only
The background worker SHALL answer a relayed request to the BE API with `{ status, data }` on success and with `{ response: { status, data } }` on failure. The answer SHALL NOT contain the request's configuration or headers. When `data` is an object, the answer SHALL NOT contain its `csrf_token` property. A local operation of the worker, which does not call the BE API (`extension.hasApiAccess`, `extension.requestApiAccess`, `clientStatus.get`, `analytics.trigger`), SHALL be answered with its value unchanged.

#### Scenario: Successful write
- **WHEN** the page relays an annotation create and the BE API answers 201 with a body
- **THEN** the page receives an object whose only keys are `status` and `data`

#### Scenario: Session lookup
- **WHEN** the page relays the session lookup and the BE API answers `{ userinfo, csrf_token }`
- **THEN** the page receives `data.userinfo`
- **AND** `data` has no `csrf_token`
- **AND** the worker has stored the token for its next write

#### Scenario: Refused request
- **WHEN** the BE API answers 403 with a body
- **THEN** the page receives `{ response: { status: 403, data } }` and nothing else

#### Scenario: Request that never reached the BE API
- **WHEN** the request fails without an answer
- **THEN** the page receives an error without `response`

#### Scenario: Local operation of the worker
- **WHEN** the page relays the site access check and the worker resolves it to `false`
- **THEN** the page receives `false`

### Requirement: The worker's API addresses come from the build
The background worker SHALL send relayed requests to the addresses compiled into it, and SHALL ignore any address a page or a content script sends.

#### Scenario: Worker starts
- **WHEN** the service worker starts
- **THEN** its API base URL is the build's `API_BASE_URL` and its auth base URL is that address without the trailing `api`

#### Scenario: First request after the worker was stopped
- **WHEN** the worker restarts and a tab relays a request
- **THEN** the request goes to the build's API base URL

#### Scenario: A page sends other addresses
- **WHEN** a page dispatches the communication settings event with another host
- **THEN** the next relayed request still goes to the build's API base URL

### Requirement: Identifiers are checked before a request is built
For every relay operation whose argument becomes part of a URL path, the worker SHALL send the request only when that argument matches `^[A-Za-z0-9_-]{1,64}$`. Otherwise it SHALL answer `{ response: { status: 400, data: { message: 'Invalid identifier' } } }` and send nothing.

#### Scenario: Accepted identifiers
- **WHEN** an annotation is requested with a ULID, with an identifier kept from the annotation server, or a profile with a numeric id
- **THEN** the request is sent

#### Scenario: Path traversal
- **WHEN** an annotation is requested with the identifier `../../user`
- **THEN** no request is sent
- **AND** the page receives status 400

#### Scenario: Query injection
- **WHEN** a notebook update is relayed with the identifier `abc?x=1`
- **THEN** no request is sent

### Requirement: Only an active tab of this extension is served
The worker SHALL ignore a runtime message whose sender is not this extension or has no tab. It SHALL serve a relay request or an image request only for a tab whose stored state is active.

#### Scenario: Active tab
- **WHEN** the user switched Pundit on in a tab and its page relays a request
- **THEN** the request is served

#### Scenario: Activation order
- **WHEN** the user switches Pundit on in a tab
- **THEN** the tab's state is stored as active before the content script is told to load the app

#### Scenario: Inactive tab
- **WHEN** a page relays a request in a tab where Pundit is off
- **THEN** nothing is sent and nothing is answered

#### Scenario: Foreign sender
- **WHEN** a message arrives whose sender id is not this extension's
- **THEN** it is ignored
