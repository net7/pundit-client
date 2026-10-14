## Why

The auth server now requires a confirmed email address before an email/password account can be used. A registration creates the account with its email unconfirmed, sends a confirmation link and opens a web session limited to the verification pages; logging in to an unconfirmed account opens the same limited session. No token is issued until the address is confirmed: the link confirms it with one click in a browser signed in to that account, and the next `me` call then returns the token. The client still treats the registration response as a login, offers a token-based "resend" that no longer exists (the old `GET api/auth/resend_verification_mail` now answers 405), and shows a "Please verify your email" toast to users who, by construction, can no longer hold a token without a confirmed address.

The login modal and the web sign-in pages are two entry points to the same account, so a user meeting an unconfirmed email in either place sees the same screen, texts and actions.

## What Changes

- **"Check your inbox"**: `422 {"error":"must_verify_email"}` from `POST api/user/register` (accepted registration) or `POST api/auth/login` (unconfirmed email) replaces the sign-up or sign-in screen with "Check your inbox": "We sent a confirmation link to **{email}**. Open it to start using Pundit.", a "Send a new link" button and a "Sign out" link. The user is not set as logged in and `RegisterEmailCompleted` is not tracked.
- **Resend**: **BREAKING** the token-based `verifyMail` (`GET`, JWT) is replaced by `POST api/auth/resend_verification_mail` with `{"email","password"}` in the body, no `Authorization` header and no `refreshHook` (a 401 here means wrong credentials, not an expired token). Outcomes: 202 "We sent a new link to {email}."; 429 `verification_mail_throttled` "We already sent a link to {email}: check your inbox, also the spam folder. You can ask for a new one in {N} minute(s)."; 429 without that body "Too many attempts: try again in a few minutes."; 401 "These credentials do not match our records."; 409 `already_verified` starts a normal login with the same credentials. The button is disabled while the request runs.
- **Sign out**: closes the limited web session (`GET api/auth/logout`), drops the credentials and returns to the sign-in form, without the password. Without it, a second registration from the same browser would be refused while the session is open.
- **After confirmation**: when the identity sync on window focus finds a user the client does not have (e.g. the address was confirmed in another tab), the login modal closes.
- **Credentials**: the email and password used by "Send a new link" live only in the open sign-in/sign-up screen (component memory). They are never written to storage, cookies, persistent state or logs, and are dropped when the request settles, on "Sign out", or when the screen or the modal closes.
- **Service error messages** aligned with the web sign-in pages: 401 "These credentials do not match our records.", 409 "The email has already been taken.".
- **Removal**: the "Please verify your email" toast (`MainLayoutDS.checkUserVerified`, `openEmailVerifiedToast`, `closeEmailVerifiedToast`, `doEmailVerifyRequest`, `state.emailVerifiedToast`), its call sites, `PunditLoginService.verifyEmail` and the `toast#verify_email_*` i18n keys.
- **Error codes**: `must_verify_email`, `verification_mail_throttled` and `already_verified` are declared once, as a typed union in the communication model, like the AI error codes.
- **`/api/auth/me` and `api/auth/refresh`**: no change. An unconfirmed account gets `401 {"error":"Unauthorized"}` like a logged-out user; the existing handling already leaves the user logged out. Tests pin that behavior and the absence of a request loop.
- `must_accept_terms` and the other statuses keep their current behavior.

## Capabilities

### New Capabilities
- `email-verification`: how the login module handles an unconfirmed email on registration and login ("Check your inbox", resend, sign out), the lifetime of the credentials it uses, the service error texts it shares with the web sign-in pages, and the 401 behavior of `me`/`refresh` for unconfirmed accounts.

### Modified Capabilities
- `in-repo-communication-layer`: the resend-verification call no longer matches the original package request (method, body, auth), so the behavior-preserving requirement gains an explicit exception for it, and the auth-flow test requirement covers the new call.

## Impact

- `src/communication/auth/verify-email.ts` (replaced by `resend-verification-mail.ts`), `src/communication/auth/index.ts`, `src/communication/model/response/auth.interface.ts` (`SourceType`, error code union).
- `src/common/models/auth-model.ts`, `src/common/types.ts` (`CrossMsgRequestId.AuthVerifyMail`), `src/chrome-ext/src/background/helpers/doCrossMessageRequest.ts`: the extension relays the new call through cross-messaging like login.
- `src/app/login-module/lib/services/email-provider.service.ts`, `helpers/validation.helper.ts`, the modal, sign-in and sign-up components, a new "Check your inbox" component, `pundit-login.service.ts`.
- `src/app/layouts/main-layout/main-layout.ds.ts`, `handlers/main-layout-identity.handler.ts`, `handlers/main-layout-app-events.handler.ts` and the identity handler spec.
- `src/app/config/i18n/en_US.ts`: new `loginmodal#*` keys, `toast#verify_email_*` removed.
- No new dependencies. Requires the auth server version that answers `must_verify_email` and the `POST` resend.
