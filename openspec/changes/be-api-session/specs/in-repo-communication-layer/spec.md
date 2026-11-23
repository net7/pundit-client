## REMOVED Requirements

### Requirement: Behavior-preserving import
**Reason**: The layer now follows the new BE API's contract (session cookie, CSRF token, new auth routes, stripped fields, `page` paging), so its requests intentionally differ from those of `net7/pundit-communication@904a5d0`.
**Migration**: The requests the layer sends are specified by the `api-session` and `api-request-contract` capabilities.

## MODIFIED Requirements

### Requirement: Request provider and auth flows are covered by unit tests
The request provider and the session flows SHALL have jest specs, with axios and the fetch adapter mocked, covering their branching logic.

#### Scenario: Credentials and no Authorization header
- **WHEN** a request is made without the `anonymous` option
- **THEN** it is sent with credentials and without an `Authorization` header
- **AND** with the `anonymous` option it is sent without credentials and without `X-CSRF-TOKEN`

#### Scenario: CSRF bootstrap
- **WHEN** two non-GET requests are made with no stored token
- **THEN** one `GET /api/csrf` is sent and both requests carry its token

#### Scenario: 419 retry
- **WHEN** a request answers 419
- **THEN** a fresh token is fetched and the request is re-sent once
- **AND** a second 419 is rethrown without a further attempt

#### Scenario: Requests wait for an in-flight session lookup
- **WHEN** a session lookup (`GET api/user`) is in flight (`ConnectionManager.ssoLoading$` pending)
- **THEN** other requests are not sent until it settles
- **AND** the lookup itself is not blocked by its own gate

#### Scenario: After hook and retry
- **WHEN** a request declares `hooks.after`
- **THEN** the hook receives the response promise and its result is returned
- **AND** `retry$` re-sends the failed request config

#### Scenario: Session lookup
- **WHEN** `GET api/user` succeeds
- **THEN** its `csrf_token` is stored and its `userinfo` returned
- **AND** on failure the error is rethrown
- **AND** in both cases the `ssoLoading$` gate is released

#### Scenario: Sign-out
- **WHEN** `POST api/auth/logout` completes
- **THEN** the stored CSRF token is cleared
