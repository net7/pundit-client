## ADDED Requirements

### Requirement: Session cookie on every request
Every request the client sends to the new BE API SHALL include credentials (cookies), except requests made with the `anonymous` option. No request SHALL carry an `Authorization` header. The client SHALL NOT store, renew or refresh an access token.

#### Scenario: Signed-in write
- **WHEN** a signed-in user saves an annotation
- **THEN** the request is sent with `credentials: 'include'`
- **AND** it carries no `Authorization` header

#### Scenario: Anonymous request
- **WHEN** a request is made with the `anonymous` option
- **THEN** it is sent without cookies and without `X-CSRF-TOKEN`

### Requirement: CSRF token on every non-GET request
Every non-GET request (POST, PUT, DELETE), including the search POSTs, the login and requests from a guest, SHALL carry the stored CSRF token in `X-CSRF-TOKEN`, unless it is made with the `anonymous` option. The client SHALL keep the most recent token received from the login response, from `GET /api/user` or from `GET /api/csrf`. When a non-GET request is about to be sent without a stored token, the client SHALL first fetch one from `GET /api/csrf`. Concurrent requests waiting for a token SHALL share a single `GET /api/csrf`.

#### Scenario: First write of a session
- **WHEN** no token is stored and the client sends a POST
- **THEN** it sends `GET /api/csrf` first
- **AND** the POST carries the token from that answer

#### Scenario: Two writes before any token
- **WHEN** two non-GET requests are fired together and no token is stored
- **THEN** exactly one `GET /api/csrf` is sent
- **AND** both requests carry its token

#### Scenario: Token from the login
- **WHEN** the email login answers with a `csrf_token`
- **THEN** the next write carries that token without fetching `GET /api/csrf`

#### Scenario: GET requests
- **WHEN** the client sends a GET
- **THEN** it carries no `X-CSRF-TOKEN` and triggers no token fetch

### Requirement: Stale CSRF token is renewed once
When a request answers 419, the client SHALL fetch a fresh token from `GET /api/csrf`, store it, and send the same request once more with it. If the retried request answers 419 again, the client SHALL surface it as an error and SHALL NOT retry further.

#### Scenario: Token rotated elsewhere
- **WHEN** a write answers 419 and the retry answers 200
- **THEN** the caller receives the 200 response and nothing is shown to the user

#### Scenario: Second 419
- **WHEN** a write answers 419 and its retry answers 419 again
- **THEN** the caller receives the error
- **AND** no third attempt is made

### Requirement: Auth routes
The client SHALL use these routes:

- `GET api/user` to learn who is signed in, reading `userinfo` and `csrf_token`;
- `POST api/auth/login` for the email login, reading `userinfo` and `csrf_token`;
- `POST api/user/register` for registration;
- `POST api/auth/logout` to sign out;
- `POST api/auth/edit_current_notebook/{id}` to change the current notebook;
- `POST api/auth/resend_verification_mail` for a new verification link.

The auth routes SHALL be reached through `authBaseUrl`. No token refresh route SHALL be called.

#### Scenario: User already signed in to the web application
- **WHEN** the client starts and `GET api/user` answers 200
- **THEN** the user is shown as signed in, as after an email login
- **AND** the answer's `csrf_token` is stored

#### Scenario: Guest
- **WHEN** the client starts and `GET api/user` answers 401
- **THEN** the client behaves as for a signed-out user today: public data, the existing sign-in invitation

#### Scenario: Email login errors
- **WHEN** the email login answers 422 `must_accept_terms`, 422 `must_verify_email` or 401
- **THEN** the login module shows today's terms flow, "check your inbox" flow, or wrong-credentials message respectively

#### Scenario: Registration
- **WHEN** registration answers 422 `must_verify_email`
- **THEN** the "check your inbox" flow is shown, as today

### Requirement: Sign-out drops the CSRF token
After `POST api/auth/logout`, the client SHALL discard the stored CSRF token, so that the next non-GET request fetches a new one.

#### Scenario: Write after sign-out
- **WHEN** the user signs out and then a guest search is sent
- **THEN** a `GET /api/csrf` precedes the search
- **AND** the search carries the new token, not the one from before the sign-out

### Requirement: Social sign-in outcome message
After opening the social sign-in popup, the client SHALL accept a `message` event only when its `event.origin` is the application's origin and its `data.source` is `'pundit-login'`. On `status: 'ok'` it SHALL call `GET api/user` and continue with the existing sign-in success path, storing the returned `csrf_token`. On `status: 'error'` it SHALL show the existing "sign-in failed" toast with its retry action. The error codes `provider_failed`, `Unauthorized` and `General error` SHALL be shown with the existing generic text; any other value SHALL be shown as it is. A popup closed without a message SHALL show nothing. The client SHALL NOT read any token from the popup.

#### Scenario: Successful social sign-in
- **WHEN** the popup posts `{source: 'pundit-login', status: 'ok'}` from the application's origin
- **THEN** the client calls `GET api/user` and the user is shown as signed in

#### Scenario: Session lookup fails after the popup
- **WHEN** the popup posts `status: 'ok'` but `GET api/user` fails
- **THEN** the "sign-in failed" toast is shown with the generic text

#### Scenario: Provider failure
- **WHEN** the popup posts `{source: 'pundit-login', status: 'error', error: 'provider_failed'}`
- **THEN** the "sign-in failed" toast shows the generic text and a retry action

#### Scenario: Readable error
- **WHEN** the popup posts `status: 'error'` with an error that is a sentence (e.g. a provider account that shares no email address)
- **THEN** the toast shows that sentence as it is

#### Scenario: Foreign message
- **WHEN** a `message` arrives from another origin, or from the application's origin without `source: 'pundit-login'`, or with `data` null
- **THEN** it is ignored

#### Scenario: Popup closed
- **WHEN** the user closes the popup or cancels at the provider and no message arrives
- **THEN** nothing is shown

### Requirement: Error statuses look as they do today
Errors from the new BE API SHALL reach the user as they do today. 419 SHALL be handled without showing anything. 401 SHALL sign the user out and reload public data. 403 SHALL keep today's handling. 429 and 503 SHALL show the existing generic error toast. No new message or string SHALL be introduced.

#### Scenario: Throttled
- **WHEN** a request answers 429
- **THEN** the existing generic error toast is shown
