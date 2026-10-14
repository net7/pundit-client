## MODIFIED Requirements

### Requirement: Behavior-preserving import
The in-repo communication layer SHALL expose at least the public API of the original `net7/pundit-communication` package (namespaces `annotation`, `notebook`, `social`, `auth`, `tag`, `comment`; `CommunicationSettings`; all exported model and request types), plus the `ai` namespace added later, and SHALL perform the same HTTP requests (URL, method, base URL, headers, credentials, body) as `net7/pundit-communication@904a5d0` for the original endpoints, except `api/auth/resend_verification_mail`, whose contract changed on the server. Changes to the imported source SHALL be limited to type-level fixes and lint fixes that do not alter runtime behavior, plus that endpoint's replacement.

#### Scenario: Same requests on the wire
- **WHEN** the client performs any communication call that existed in the original package (e.g. create annotation, search notebooks, login, SSO, refresh), other than the resend of the verification mail
- **THEN** the HTTP request issued is identical to the one issued by the previous package version

#### Scenario: Known library defects are preserved
- **WHEN** the imported source contains a runtime defect (e.g. `refreshHook` reading `err.response.status` on response-less errors)
- **THEN** the defect is left unchanged in this change and recorded as a follow-up

## ADDED Requirements

### Requirement: Credential-based resend of the verification mail
The `auth` namespace SHALL expose `resendVerificationMail({ email, password })`, replacing `verifyMail`. It SHALL send `POST api/auth/resend_verification_mail` to `CommunicationSettings.authBaseUrl` with `{"email","password"}` as JSON body, SHALL NOT send an `Authorization` header even when `CommunicationSettings.token` is set, SHALL NOT be wrapped by `refreshHook`, and SHALL NOT read or change `CommunicationSettings.token`. In the chrome extension it SHALL be relayed to the background like the other auth calls.

#### Scenario: Request on the wire
- **WHEN** `auth.resendVerificationMail({ email: 'a@b.c', password: 'secret' })` is called while a token is stored
- **THEN** axios is called once with `url: 'api/auth/resend_verification_mail'`, `method: 'post'`, the auth base URL and `data: { email: 'a@b.c', password: 'secret' }`
- **AND** the request has no `Authorization` header
- **AND** `CommunicationSettings.token` is unchanged

#### Scenario: 401 is not a token problem
- **WHEN** the resend request answers 401
- **THEN** the error is rethrown as is
- **AND** no `api/auth/refresh` request is made and no retry happens

#### Scenario: Extension relay
- **WHEN** the call is made from a content script of the chrome extension
- **THEN** it is sent through cross-messaging with its own `CrossMsgRequestId` and executed by `doCrossMessageRequest` in the background
- **AND** the error forwarded back keeps `response.status` and `response.data`
