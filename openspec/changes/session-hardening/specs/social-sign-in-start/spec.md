## ADDED Requirements

### Requirement: The BE API starts a social sign-in
To sign in with a provider the client SHALL open, in the popup, the address configured for that provider and nothing else. That address is a route of the new BE API (`<authBaseUrl>login/{provider}/pundit`). The client SHALL NOT send a client id, a redirect URI, a scope or a response type.

#### Scenario: Google
- **WHEN** the user chooses "Sign in with Google"
- **THEN** the popup opens the configured address unchanged, without a query string added by the client

#### Scenario: Every provider
- **WHEN** the user chooses Facebook or EGI
- **THEN** the popup opens that provider's configured address unchanged

#### Scenario: Configuration
- **WHEN** a provider is configured
- **THEN** its parameters hold a `url` and no client id, redirect URI or scope

### Requirement: The outcome "already signed in" has its own message
When the popup reports `{ source: 'pundit-login', status: 'error', error: 'already_signed_in' }`, the client SHALL show the text of `toast#login_already_signed_in_text` and SHALL leave the current identity as it is.

#### Scenario: Another account is signed in
- **WHEN** the popup reports `already_signed_in`
- **THEN** the sign-in error toast shows "You are already signed in with another account. Sign out first."
- **AND** no session lookup is made

#### Scenario: Other outcomes
- **WHEN** the popup reports `ok`, `provider_failed` or any other code
- **THEN** the client behaves as before this change
