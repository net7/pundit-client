## 1. Communication layer

- [x] 1.1 Add the `AuthErrorCode` union (`must_verify_email`, `verification_mail_throttled`, `already_verified`) and the auth error body type to `src/communication/model/response/auth.interface.ts`
- [x] 1.2 Replace `src/communication/auth/verify-email.ts` with `resend-verification-mail.ts` (`POST`, `{ email, password }` body, `skipAuth: true`, no `refreshHook`, no token read/write) and export it as `auth.resendVerificationMail`
- [x] 1.3 Remove `SuccessVerifyEmailResponse` and `SourceType` `'verify'` if unused; update `src/testing/communication.mock.ts` if needed
- [x] 1.4 Add `resend-verification-mail.spec.ts`: wire request, no `Authorization` with a token set, token unchanged, 401 rethrown with no refresh call
- [x] 1.5 Add 401 `{"error":"Unauthorized"}` cases to `sso.spec.ts` and `refresh.spec.ts`: token cleared, error rethrown, single request, no loop

## 2. Model and chrome extension

- [x] 2.1 Rename `CrossMsgRequestId.AuthVerifyMail` to `AuthResendVerificationMail` (`'auth.resendVerificationMail'`) in `src/common/types.ts`
- [x] 2.2 Replace `AuthModel.verifyEmail` with `AuthModel.resendVerificationMail(params)` under `@CrossMessage`
- [x] 2.3 Update the handler entry in `src/chrome-ext/src/background/helpers/doCrossMessageRequest.ts`

## 3. Login module

- [x] 3.1 Add `getAuthErrorCode(err)` helper reading `err.response.status`/`err.response.data` and narrowing to `AuthErrorCode`
- [x] 3.2 `EmailProviderService.register`: on 422 `must_verify_email` emit `mustVerifyEmail$`, clear loading, no `error$`, no `AuthEventService.set`, no `RegisterEmailCompleted`
- [x] 3.3 `EmailProviderService.login`: on 422 `must_verify_email` emit `mustVerifyEmail$`, clear loading, no popup, no `error$`; leave `mustAcceptTerms` untouched
- [x] 3.4 `EmailProviderService.resendVerificationMail(credentials)`: map 202 / 429 throttled / 429 other / 401 / 409 / other to `ResendOutcome`; on 409 call `login` with the same credentials and the configured terms parameters
- [x] 3.5 Create `VerifyEmailComponent` (standalone, OnPush): "Check your inbox" text, "Send a new link" button disabled while sending, outcome message
- [x] 3.6 `SignInComponent`: snapshot credentials at submit, show "Check your inbox" on `mustVerifyEmail$`, drop the snapshot when the request settles and the credentials on `ngOnDestroy`
- [x] 3.7 `SignUpComponent`: snapshot credentials at submit, show "Check your inbox" on `mustVerifyEmail$`, drop the snapshot when the request settles and the credentials on `ngOnDestroy`
- [x] 3.8 Add the `loginmodal#verify_email_*` keys to `src/app/config/i18n/en_US.ts` and read them with `_t`

- [x] 3.9 Make "Check your inbox" replace the whole sign-in/sign-up content with the web page's texts, and hide the modal footer while it is shown
- [x] 3.10 Add "Sign out" (`EmailProviderService.signOut`): back to the sign-in form, without the password
- [x] 3.11 Use the web sign-in pages' texts for 401 and 409 in `validationHelper`
- [x] 3.12 Close the login modal when the identity sync logs in a user the client does not have

## 4. Remove the verification toast

- [x] 4.1 Delete `checkUserVerified`, `closeEmailVerifiedToast`, `openEmailVerifiedToast`, `doEmailVerifyRequest` and `state.emailVerifiedToast` from `main-layout.ds.ts`
- [x] 4.2 Drop their calls in `main-layout-identity.handler.ts` and `main-layout-app-events.handler.ts`, and the mock in `main-layout-identity.handler.spec.ts`
- [x] 4.3 Delete `PunditLoginService.verifyEmail`
- [x] 4.4 Delete the `toast#verify_email_*` keys after checking they have no other usage

## 5. Login-module specs

- [x] 5.1 `email-provider.service.spec.ts`: register and login 422 (event, not logged, no `RegisterEmailCompleted`, no popup), resend outcomes for 202, both 429s, 401, 409 → login with same credentials, `signOut`, `must_accept_terms` unchanged
- [x] 5.2 `verify-email` component spec: title and text, outcome messages, button calls the service with the form credentials and is disabled while pending, "Sign out" emits after the logout
- [x] 5.3 Sign-in/sign-up specs: "Check your inbox" replaces the form with the submitted credentials; "Sign out" brings back the sign-in form; credentials dropped when the request settles and on destroy; storage, cookie and console never receive the password
- [x] 5.4 Identity handler spec: SSO `{ error: 'Unauthorized' }` leaves the user logged out and opens no toast

## 6. Verification

- [x] 6.1 Run `npm test` and `npm run lint`; build the chrome extension stage target to check the relay compiles
- [x] 6.2 `grep` for `verifyMail`, `verifyEmail`, `verify_email_`, `is_verified` usages and the literal codes outside their declaration
- [x] 6.3 Show the diff for review before committing
