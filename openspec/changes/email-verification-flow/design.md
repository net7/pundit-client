## Context

Email/password auth lives in `src/app/login-module`: `SignInComponent` and `SignUpComponent` (rendered by `ModalComponent` through `@switch (status)`, so they are destroyed when the user switches screen or closes the modal) call the root `EmailProviderService`, which calls `AuthModel.login`/`signup`. `AuthModel` methods carry `@CrossMessage`, so in the chrome extension they run in the background (`doCrossMessageRequest.ts`) and a failure comes back as `{ response: error.response }`; in the web build they run in page as axios calls. In both cases the server status and body are at `err.response.status` and `err.response.data`.

Server behavior this change targets: a registration creates the account with its email unconfirmed, sends a confirmation link and opens a web session limited to the verification pages; a login to an unconfirmed account opens the same limited session. Neither returns a token (422 `must_verify_email`), and `me`/`refresh` answer 401 until the address is confirmed. The link confirms it with one click in a browser signed in to that account; `me` then returns the token. While the limited session is open, a new registration from the same browser is refused (500). The web sign-in pages show "Check your inbox" in both cases, with "Send a new link" and "Sign out".

Today:
- `register` treats any 2xx as a login and every error as a form error (`error$` → `validationHelper.getServiceErrorMessage(status)`).
- `login` checks `must_accept_terms` with `err instanceof HttpErrorResponse && err.error.error === ...`, opens the terms popup and returns `EMPTY`. The check never matches: login has gone through axios since it moved off `HttpClient` in 2021, so the error is an axios error (web) or the relayed `{ response }` object (extension), never an `HttpErrorResponse`. A 422 `must_accept_terms` therefore shows the generic service error and no popup.
- `auth.verifyMail` is a `GET api/auth/resend_verification_mail` using the stored token; it is reachable only from the "Please verify your email" toast in `MainLayoutDS`, opened by `checkUserVerified(user)` from the identity handler and closed on logout by the app-events handler.
- `sso` (`/api/auth/me`) and `refreshToken` are not wrapped by `refreshHook`; on failure they clear the token and rethrow, and the identity handler treats the `{ error }` result as logged out.

## Goals / Non-Goals

**Goals:**
- Handle `must_verify_email` on register (success outcome) and login (blocked outcome) with the same "Check your inbox" screen, texts and actions as the web sign-in pages.
- Use the web sign-in pages' texts for the service errors both meet (401, 409).
- Close the login modal once the account is confirmed and the identity sync logs the user in.
- Replace the token-based resend with the credential-based `POST`, identical in web and extension.
- Keep the credentials for the button in component memory only.
- Remove the post-login verification toast and everything only it uses.
- Cover the new flows, and the unchanged `me`/`refresh` 401 behavior, with jest specs.

**Non-Goals:**
- Changing `must_accept_terms`, other status codes or the OAuth providers.
- Any web-side confirmation page (the link is opened on the web, not in the client), and the link states it handles (expired, invalid, other account).
- Aligning the registration form fields and validation (password confirmation, length limits, reCAPTCHA): a separate change.
- Fixing the pre-existing `must_accept_terms` detection: done in a separate commit after this change (see Follow-ups).
- Localizing the existing hard-coded login-module strings.

## Decisions

### D1. Error codes: one typed union in the communication model
Add to `src/communication/model/response/auth.interface.ts`:
`export type AuthErrorCode = 'must_verify_email' | 'verification_mail_throttled' | 'already_verified';` plus the error body type (`{ error: AuthErrorCode | string; retry_after_minutes?: number }`). The login module gets a small helper (`getAuthErrorCode(err)` in `helpers/`) that reads `err?.response?.data?.error` and narrows it to the union, mirroring `getAiErrorCode`. Comparisons use typed constants, so the literals live only in the union.
*Alternative*: an `enum` — rejected, the AI codes use a string union and the request asks to follow them.

### D2. Status/body read from `err.response`, not `HttpErrorResponse`
The new checks read `err?.response?.status` / `err?.response?.data`, the shape produced by axios in page and by the extension relay. `mustAcceptTerms` is left untouched in this change (constraint); its follow-up fix reuses the same `getAuthErrorCode`-style read.

### D3. Service outcome stream, credentials stay in the component
`EmailProviderService` gains `mustVerifyEmail$: Subject<void>`. On `must_verify_email` it emits, then clears `isLoading$`, does not emit `error$`, does not call `AuthEventService.set` and does not track analytics. The service never stores the credentials: `SignInComponent`/`SignUpComponent` take an immutable snapshot `{ email, password }` of the form value at submit time, and on `mustVerifyEmail$` move it into `verifyCredentials`. Only the screen with a submit in flight reacts, since both subscribe to the same root service.
*Alternative*: emit the credentials from the service — rejected, a root singleton holding a password risks leaking it past the screen's lifetime.

### D4. "Check your inbox" component
New standalone, OnPush `VerifyEmailComponent` (`lib-pundit-login-verify-email`) in `components/verify-email/`, with inputs `credentials` and `disabled` (the parent form has a request in flight) and output `signedOut`. Laid out like the web page: logo and title "Check your inbox", "We sent a confirmation link to **{email}**.<br>Open it to start using Pundit.", the last outcome message (error style for failures), the "Send a new link" button (disabled while sending, signing out or `disabled`) and a "Sign out" link. Sign-in and sign-up render it instead of their whole content (header, form, social buttons) while `verifyCredentials` is set, and emit `verifyingChange` so `ModalComponent` hides the footer that links the two screens, as the web page has no such link. The submit snapshot is dropped as soon as the request settles (`isLoading$` false), after being moved into `verifyCredentials` on `must_verify_email`; `verifyCredentials` is dropped on "Sign out" and in `ngOnDestroy` (screen switch / modal close).
*Alternative*: a notice above the login form — rejected: the two entry points would show different screens for the same account state.

### D5. Resend call
`src/communication/auth/resend-verification-mail.ts` replaces `verify-email.ts`:
`request$('api/auth/resend_verification_mail', { baseURL: authBaseUrl, method: 'post', data: { email, password }, skipAuth: true })`. No `hooks.after` (no `refreshHook`), no `withCredentials` (no session needed), no token read/write. `skipAuth` matters in the extension, where the background may hold another user's token. `AuthModel.verifyEmail` → `AuthModel.resendVerificationMail(params)` with `@CrossMessage(CrossMsgRequestId.AuthResendVerificationMail)` (`'auth.resendVerificationMail'`), and the `doCrossMessageRequest` entry is renamed accordingly. `SuccessVerifyEmailResponse` and `SourceType` `'verify'` are removed if nothing else uses them.

### D6. Resend outcome mapping in the service
`EmailProviderService.resendVerificationMail(credentials): Observable<ResendOutcome>` where `ResendOutcome = { kind: 'sent' } | { kind: 'throttled'; minutes: number } | { kind: 'too_many_attempts' } | { kind: 'wrong_credentials' } | { kind: 'already_verified' } | { kind: 'error' }`:
- 2xx → `sent`
- 429 + `verification_mail_throttled` + numeric `retry_after_minutes` → `throttled`
- other 429 → `too_many_attempts`
- 401 → `wrong_credentials`
- 409 + `already_verified` → `already_verified`, and the service calls `this.login(credentials, terms)` with the configured terms parameters
- anything else → `error` (existing generic service message)
The component maps the outcome to the i18n text; the credentials are passed per call and not kept.

### D7. Texts
The same texts as the web sign-in pages. New keys in `src/app/config/i18n/en_US.ts`, prefix `loginmodal#`, placeholders in the existing `{ name }` style: `verify_email_title` ("Check your inbox"), `verify_email_sent_to` ("We sent a confirmation link to"), `verify_email_open_link` ("Open it to start using Pundit."), `verify_email_resend_action` ("Send a new link"), `verify_email_resend_sent` ("We sent a new link to { email }."), `verify_email_resend_throttled` ("We already sent a link to { email }: check your inbox, also the spam folder. You can ask for a new one in { minutes } { unit }."), `minute`/`minutes` for `{ unit }`, `verify_email_resend_too_many_attempts` ("Too many attempts: try again in a few minutes.", no web counterpart), `verify_email_sign_out` ("Sign out"). `retry_after_minutes` is the time left before a new link can be asked for, hence "in { minutes }". A 401 reuses the service error text (D11). Read with `_t` from `@net7/core`, like the layouts.

### D8. Toast removal
Delete `checkUserVerified`, `closeEmailVerifiedToast`, `openEmailVerifiedToast`, `doEmailVerifyRequest` and `state.emailVerifiedToast` from `MainLayoutDS`; drop the three calls in `main-layout-identity.handler.ts`, the logout call in `main-layout-app-events.handler.ts`, the `checkUserVerified` mock in the identity handler spec, `PunditLoginService.verifyEmail`, and the five `toast#verify_email_*` keys (only used there). `AuthUser.is_verified` stays in the model: it mirrors the server payload.

### D11. Service error texts
`validationHelper` `SERVICE_ERRORS_MAP`: 401 → "These credentials do not match our records.", 409 → "The email has already been taken.", as on the web sign-in pages. Other entries unchanged.

### D12. Sign out
`EmailProviderService.signOut()` wraps `AuthModel.logout()` (`GET api/auth/logout` with credentials: it ends the web session without needing a token) and completes when it settles, ignoring failures. The link waits for it before showing the sign-in form, so a registration started right after does not race the logout. From sign-in: `verifyCredentials = null`, password emptied and untouched, email kept. From sign-up: `signedOut` output, `ModalComponent` switches to `SIGNIN`, which destroys the sign-up screen.

### D13. Closing the modal after confirmation
The identity sync (window focus) already logs in a user that `me` returns and the client does not have. Its callback also calls `punditLoginService.stop()`, so "Check your inbox" does not stay open over a logged-in page once the address is confirmed in another tab. Closing an already closed modal is a no-op.

### D9. me/refresh: tests only
No code change: `sso` and `refreshToken` are not wrapped by `refreshHook`, so a 401 clears the token and rethrows once. Specs pin it: `sso.spec.ts` (401 `Unauthorized` → token null, one axios call), `refresh.spec.ts` (original 401 + refresh 401 → token null, rethrow, one refresh call), identity handler spec (`{ error: 'Unauthorized' }` → not logged).

### D10. Tests
Jest, as the existing specs:
- `src/communication/auth/resend-verification-mail.spec.ts`: wire request, no `Authorization` with a token set, token untouched, 401 rethrown without a refresh call.
- `email-provider.service.spec.ts` (TestBed, `AuthModel` spied): register/login 422 → `mustVerifyEmail$`, no `AuthEventService.set`, no `RegisterEmailCompleted`, no popup, loading cleared after the event; resend outcome mapping for 202, both 429s, 401; 409 → `login` called with the same credentials; `signOut` completes on success and failure; `must_accept_terms` path unchanged; the service holds no credential.
- `verify-email.component.spec.ts`: title and text, outcome messages (singular/plural minutes), button calls the service with the inputs and is disabled while pending, "Sign out" emits after the logout settles.
- Sign-in/sign-up component specs: "Check your inbox" replaces the form with the submitted credentials and hides the footer; "Sign out" brings back the sign-in form (sign-in: no password; sign-up: `signedOut`); the snapshot is dropped when the request settles; destroy clears the credentials; storage, cookie and console never receive the password.
- Identity handler spec: the sync's automatic login closes the login modal.

## Risks / Trade-offs

- [The `must_verify_email` branch keeps the modal open, unlike the terms branch whose popup closes it and so discards the stale loading state] → The new branch explicitly emits `isLoading$.next(false)`, otherwise the submit button would stay in the loading state.
- [Password in memory while "Check your inbox" is open] → Scoped to the component instance, cleared on sign out/close/destroy; never in a singleton, storage or logs. In the extension it transits the cross-message channel like the login call already does.
- [The user closes the modal without "Sign out"] → The limited session stays until it expires or a login replaces it (the login endpoint ends any current session first); a registration from the same browser meanwhile gets the generic error.
- [The extension relay serializes `error.response`] → `status` and `data` survive JSON cloning; headers are not needed.
- [409 auto-login may hit `must_accept_terms` or `must_verify_email` again] → It goes through the normal `login` path, so it behaves like a direct login: until the follow-up fix, `must_accept_terms` shows the generic error there too.
- [Concurrent OpenSpec change `ai-annotate-communication-flow` also modifies "Behavior-preserving import"] → This delta is written on top of that change's wording; archive that change first.

## Migration Plan

Ship together with, or after, the auth server release that returns `must_verify_email` and accepts the `POST` resend. Against an older server the client keeps working for existing verified users; registrations would still succeed as before. Rollback: revert the commit; the server's 405 on the old `GET` only affected the removed toast.

## Follow-ups

- Align the registration form fields and validation with the web form (password confirmation, length limits, reCAPTCHA), in a separate change.

- Fix the `must_accept_terms` detection in a separate commit after this change: read `err?.response?.status === 422` and `err?.response?.data?.error === 'must_accept_terms'` (axios and extension relay shape) instead of `instanceof HttpErrorResponse`, and add a spec covering both shapes. Confirmed with a probe spec: with a real axios 422 `must_accept_terms` error, and with the relayed `{ response }` object, `popupService.open` is never called and the user sees "We are unable to process your request at this time. Please try again later.".
