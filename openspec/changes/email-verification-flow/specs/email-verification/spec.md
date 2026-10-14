## ADDED Requirements

### Requirement: Auth error codes are declared once
The auth error codes `must_verify_email`, `verification_mail_throttled` and `already_verified` SHALL be declared once, as a typed union exported by the communication model (like `AiAnnotateErrorCode`), and every check on them SHALL be typed by that union, as the AI error codes are.

#### Scenario: Single declaration
- **WHEN** client code checks a response for one of these codes
- **THEN** it narrows the response code to the exported union and compares against values of that type
- **AND** a misspelled code fails type-checking

### Requirement: Unconfirmed email shows "Check your inbox"
When `POST api/user/register` (an accepted registration) or `POST api/auth/login` (an account whose email is not confirmed) answers `422 {"error":"must_verify_email"}`, the sign-up or sign-in screen SHALL be replaced, together with the modal footer that links the two screens, by "Check your inbox": the text "We sent a confirmation link to **{email}**. Open it to start using Pundit.", a "Send a new link" button and a "Sign out" link. The screen and its texts SHALL be the same for registration and login. The user SHALL NOT be set as logged in, `RegisterEmailCompleted` SHALL NOT be tracked, no popup SHALL open, no service error message SHALL be shown, and the loading state SHALL be cleared.

#### Scenario: Registration accepted
- **WHEN** the user submits the registration form and the server answers 422 `must_verify_email`
- **THEN** "Check your inbox" replaces the form, with the submitted email in bold
- **AND** `AuthEventService.set` is not called and `AnalyticsAction.RegisterEmailCompleted` is not tracked
- **AND** the modal footer ("Already have a Pundit account?") is hidden

#### Scenario: Login with an unconfirmed email
- **WHEN** the user submits the login form and the server answers 422 `must_verify_email`
- **THEN** "Check your inbox" replaces the form, with the submitted email in bold
- **AND** no popup is opened and `AuthEventService.set` is not called
- **AND** the modal footer ("Don't have a Pundit account yet?") is hidden

#### Scenario: Only the submitting screen reacts
- **WHEN** `must_verify_email` is reported while the screen has no request of its own in flight
- **THEN** the screen keeps its form

#### Scenario: Other registration and login errors
- **WHEN** login or registration fails with any other status or code (including 422 `must_accept_terms`)
- **THEN** the client behaves as before this change, except for the service error texts of the requirement below

### Requirement: Service error texts match the web sign-in pages
The login and sign-up screens SHALL show the same texts as the web sign-in pages for the errors both can meet: 401 "These credentials do not match our records." and 409 "The email has already been taken.". The other service error texts SHALL stay unchanged.

#### Scenario: Wrong credentials on login
- **WHEN** `POST api/auth/login` answers 401
- **THEN** the sign-in screen shows "These credentials do not match our records."

#### Scenario: Address already registered
- **WHEN** `POST api/user/register` answers 409
- **THEN** the sign-up screen shows "The email has already been taken."

### Requirement: "Send a new link" asks for a new confirmation link
The "Send a new link" button SHALL call the resend-verification request with the email and password of the form that led to "Check your inbox", SHALL be disabled while that request or the form's own request is in flight, and SHALL map the response to a message:
- 202: "We sent a new link to {email}."
- 429 with `{"error":"verification_mail_throttled","retry_after_minutes":N}`: "We already sent a link to {email}: check your inbox, also the spam folder. You can ask for a new one in {N} minutes." ("1 minute" when N is 1)
- 429 without that body: "Too many attempts: try again in a few minutes."
- 401: "These credentials do not match our records."
- 409 `{"error":"already_verified"}`: no message; a normal email/password login starts with the same credentials.
- any other failure: the existing generic service error message.

#### Scenario: New link sent
- **WHEN** the resend request answers 202
- **THEN** "Check your inbox" shows "We sent a new link to user@example.org."

#### Scenario: Asked again too soon
- **WHEN** the resend request answers 429 `{"error":"verification_mail_throttled","retry_after_minutes":15}`
- **THEN** "Check your inbox" shows "We already sent a link to user@example.org: check your inbox, also the spam folder. You can ask for a new one in 15 minutes."

#### Scenario: Rate limited without body
- **WHEN** the resend request answers 429 without the `verification_mail_throttled` body
- **THEN** "Check your inbox" shows "Too many attempts: try again in a few minutes."

#### Scenario: Wrong credentials
- **WHEN** the resend request answers 401
- **THEN** "Check your inbox" shows "These credentials do not match our records."
- **AND** no token refresh is attempted

#### Scenario: Already verified
- **WHEN** the resend request answers 409 `already_verified`
- **THEN** `EmailProviderService.login` is called with the same email and password

#### Scenario: Button disabled while sending
- **WHEN** the resend request is in flight
- **THEN** the "Send a new link" button is disabled
- **AND** it is enabled again when the request settles

### Requirement: "Sign out" closes the limited session
The "Sign out" link SHALL close the web session that the registration or login left open on the auth server (`AuthModel.logout()`, whose failure is ignored) and, once the request settles, SHALL drop the credentials and show the sign-in form: from the sign-in screen with the submitted email and an empty password, from the sign-up screen by switching the modal to the sign-in screen.

#### Scenario: Sign out from login
- **WHEN** the user clicks "Sign out" on "Check your inbox" reached from the sign-in screen
- **THEN** the logout request is made, and the sign-in form is shown again with the email and an empty password

#### Scenario: Sign out from registration
- **WHEN** the user clicks "Sign out" on "Check your inbox" reached from the sign-up screen
- **THEN** the logout request is made, and the modal shows the sign-in screen

### Requirement: The login modal closes once the account is confirmed
When the identity sync finds a signed-in user the client does not have (for instance, the address was confirmed in another tab and `me` now returns the token), the client SHALL close the login modal as part of the automatic login.

#### Scenario: Back from the confirmation link
- **WHEN** "Check your inbox" is open, the user confirms the address in another tab and comes back, and the sync's `me` call returns a user
- **THEN** the user is logged in and the login modal closes

### Requirement: Verification credentials are not persisted
The email and password used by "Send a new link" SHALL be held only in the memory of the open sign-in/sign-up screen. The copy taken at submit SHALL be dropped when the request settles, after being handed to "Check your inbox" if needed. They SHALL NOT be written to `localStorage`, `sessionStorage`, `chrome.storage`, cookies, any root/singleton service field or any log, and SHALL be dropped on "Sign out" and when the screen or the modal closes.

#### Scenario: Nothing is stored
- **WHEN** "Check your inbox" is shown and a resend is performed
- **THEN** no storage API, cookie or console method receives the password
- **AND** `EmailProviderService` keeps no reference to the credentials after the call returns

#### Scenario: Credentials dropped
- **WHEN** the login request settles, the user signs out, switches screen or closes the modal
- **THEN** the screen no longer holds the credentials

### Requirement: Unconfirmed accounts look logged out on me and refresh
`POST /api/auth/me` and `POST api/auth/refresh` answer `401 {"error":"Unauthorized"}` for an unconfirmed account. The client SHALL handle this exactly like any logged-out user, with no handling specific to `must_verify_email` on these calls, and SHALL NOT enter a request loop.

#### Scenario: SSO answers 401
- **WHEN** `POST /api/auth/me` answers `401 {"error":"Unauthorized"}`
- **THEN** the token is cleared, the user is treated as not logged in, and the request is issued once

#### Scenario: Refresh answers 401
- **WHEN** a request wrapped by `refreshHook` fails with 401 and `POST api/auth/refresh` also answers 401
- **THEN** the token is cleared, the error is rethrown, and the refresh is issued once without being retried

### Requirement: No email-confirmation reminder for logged-in users
Users holding a token always have a confirmed email, so the client SHALL NOT show any "Please verify your email" reminder after login and SHALL NOT read `user.is_verified` to decide it. The token-based resend (`GET api/auth/resend_verification_mail`, now answering 405) SHALL NOT be called anywhere.

#### Scenario: Login or identity sync
- **WHEN** the user logs in, the SSO identity is loaded, or the identity is re-synced on window focus
- **THEN** no email-verification toast is opened, whatever the value of `user.is_verified`

#### Scenario: No token-based resend
- **WHEN** the codebase is searched for calls to `api/auth/resend_verification_mail`
- **THEN** the only call is the credential-based `POST` request
