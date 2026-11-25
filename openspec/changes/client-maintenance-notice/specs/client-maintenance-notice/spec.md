## ADDED Requirements

### Requirement: Status source configured per environment

The client SHALL read the maintenance status from a URL configured per environment: `statusUrl` in `src/environments/local.*.ts` for the application (embed, web and PDF viewers), and the build constant `STATUS_URL` for the extension's background service worker. Without a configured URL the client SHALL make no status request and SHALL behave exactly as before this change.

#### Scenario: No status URL configured
- **WHEN** the client starts and `statusUrl` is missing or empty
- **THEN** it makes no status request, shows no notice and loads the session and the annotations as before

#### Scenario: Extension background uses its own URL
- **WHEN** the page asks the background service worker for the status
- **THEN** the background requests `STATUS_URL` and ignores any URL or argument sent by the page

### Requirement: Private, uncached status request

The status request SHALL be a plain `GET` without cookies (`credentials: 'omit'`), without authentication headers, without referrer (`referrerPolicy: 'no-referrer'`) and without the browser cache (`cache: 'no-store'` and a cache-busting query parameter). It SHALL carry no personal data and no identifier of the user. It SHALL be aborted after 3 seconds.

#### Scenario: Request shape
- **WHEN** the client requests the status
- **THEN** the request has no `Cookie` and no `Authorization` header, no `Referer`, and a query parameter that changes on every request

#### Scenario: Slow server
- **WHEN** the status URL does not answer within 3 seconds
- **THEN** the request is aborted and handled as a failed read

### Requirement: When the status is read

The client SHALL read the status at startup, before Pundit starts; every 5 minutes while the page is visible; and when the page becomes visible again. A status read less than 60 seconds earlier SHALL be reused without a new request.

#### Scenario: Startup waits for the status
- **WHEN** the client starts with a status URL configured
- **THEN** Pundit starts only after the status is read or the read fails (at most ~3.5 seconds)

#### Scenario: Hidden tab
- **WHEN** the page is hidden
- **THEN** the periodic read is skipped, and the status is read again when the page becomes visible (unless the last read is younger than 60 seconds)

### Requirement: Status format and validation

The client SHALL accept a JSON object with `version` equal to `1` and a `notices` array. A notice SHALL be considered only if it has a string `id`, `active` equal to `true` and `level` equal to `"maintenance"`. Unknown fields SHALL be ignored. Notices of other levels SHALL be ignored. A response with another `version`, without a `notices` array, or that is not JSON SHALL be handled as a failed read.

#### Scenario: Notice switched off
- **WHEN** the response is `{ "version": 1, "notices": [] }`
- **THEN** no notice applies

#### Scenario: Unknown fields
- **WHEN** a notice carries fields the client does not know
- **THEN** the client ignores them and evaluates the notice as usual

#### Scenario: Unknown level
- **WHEN** the only notice has `level` `"info"`
- **THEN** no notice applies

#### Scenario: Inactive notice
- **WHEN** a notice has `active` `false`
- **THEN** the notice does not apply

#### Scenario: Missing required fields
- **WHEN** a notice has no `id` or no `level`
- **THEN** the notice is ignored

#### Scenario: Unsupported format version
- **WHEN** the response has `version` `2`
- **THEN** it is handled as a failed read

### Requirement: Notice applies to client versions

A maintenance notice without `appliesTo.maxClientVersion` SHALL apply to every client. With it, the notice SHALL apply only when the client's version, compared on the segments that `maxClientVersion` has, is lower than or equal to it. Segments are compared as integers and missing ones count as 0. The client's version SHALL be the installed manifest version in the extension and the `package.json` version in the other builds. An invalid `maxClientVersion`, or an unknown client version, SHALL make the notice apply as if `maxClientVersion` were absent.

#### Scenario: Old extension
- **WHEN** `maxClientVersion` is `"1.18.0"` and the extension is 1.18.0
- **THEN** the notice applies

#### Scenario: Stage build of the same release
- **WHEN** `maxClientVersion` is `"1.18.0"` and the extension is 1.18.0.1
- **THEN** the notice applies, because only the first three segments are compared

#### Scenario: New extension
- **WHEN** `maxClientVersion` is `"1.18.0"` and the extension is 1.19.0 or 1.19.0.2
- **THEN** the notice does not apply

#### Scenario: Invalid maxClientVersion
- **WHEN** `maxClientVersion` is `"latest"`
- **THEN** the notice applies to every client, with the maintenance text

### Requirement: Last known status on failure

When a read fails (network error, timeout, HTTP status other than 2xx, invalid JSON or invalid format), the client SHALL keep the last valid status read in the current page session. Without one, no notice SHALL apply. The status SHALL be kept in memory only. No failure of the status read SHALL throw outside the status service or stop the client from working.

#### Scenario: First read fails
- **WHEN** the client starts and the status URL answers 404
- **THEN** no notice applies and Pundit starts as before

#### Scenario: Read fails while a notice is shown
- **WHEN** a notice applies and a later read times out
- **THEN** the notice stays

#### Scenario: Read fails after the notice was switched off
- **WHEN** the last valid read had no notice and a later read returns invalid JSON
- **THEN** no notice applies

#### Scenario: Rate limited
- **WHEN** the status URL answers 429
- **THEN** it is handled as a failed read

### Requirement: Notice in place of Pundit

While a notice applies, the client SHALL NOT start Pundit. It SHALL show the notice instead, in a sidebar that looks like Pundit's (logo to open and close it, a header with the status and Pundit's actions disabled), announced to assistive technologies (`role="alert"`) and not dismissible, together with a warning toast with the same words. Without Pundit's own sidebar, selection tooltip or modals, no API call and no user action are possible: the session is not looked up, no annotation is loaded, nothing can be written. Without a notice applying, the client SHALL be unchanged.

#### Scenario: Startup during maintenance
- **WHEN** the client starts and a notice applies
- **THEN** it shows the notice in its sidebar and in a toast, does not start Pundit, and makes no API call

#### Scenario: Notice switched on during a session
- **WHEN** a notice starts to apply while Pundit is running
- **THEN** Pundit stops (its sidebar, tooltip, modals and toasts disappear), its highlights are removed from the page, and the notice is shown

#### Scenario: Notice switched off
- **WHEN** a notice stops applying
- **THEN** the notice disappears and Pundit starts as on load (session lookup, then data), without a page reload

#### Scenario: No notice
- **WHEN** no notice applies
- **THEN** Pundit starts and works as before this change

### Requirement: Notice text

The notice text SHALL come from the client's English translations, chosen as follows:

- without `maxClientVersion`: "Pundit is under maintenance";
- with `maxClientVersion`, in the extension: a request to update the extension;
- with `maxClientVersion` in the other builds: a request to reload the page.

#### Scenario: Maintenance text
- **WHEN** the applying notice has no `maxClientVersion`
- **THEN** the notice shows the maintenance title and text

#### Scenario: Outdated extension
- **WHEN** the applying notice has `maxClientVersion` and the client is the extension
- **THEN** the notice asks the user to update the Pundit extension

#### Scenario: Outdated embed
- **WHEN** the applying notice has `maxClientVersion` and the client is not the extension
- **THEN** the notice asks the user to reload the page
