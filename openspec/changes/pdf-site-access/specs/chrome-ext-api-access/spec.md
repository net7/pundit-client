## ADDED Requirements

### Requirement: Detecting missing access to the application's site
When the session lookup (`GET api/user`) fails with anything other than 401 in the extension, the client SHALL check whether the extension has access to the application's site (the origin of `authBaseUrl`, `<origin>/*`). The check SHALL run in the PDF viewer and on web pages; where the extension permissions API is not available (embed bundle, web viewer), the client SHALL show the generic error toast as before.

#### Scenario: Application's site excluded
- **WHEN** the user has set the extension's site access to "On specific sites" without the application's site
- **AND** the session lookup fails with a CORS error
- **THEN** the client finds that Pundit has no access to the application's site

#### Scenario: Access granted, server error
- **WHEN** Pundit has access to the application's site and the session lookup answers 500
- **THEN** the client shows the generic error toast and loads the public data

#### Scenario: Embed bundle
- **WHEN** the session lookup fails in the embed bundle
- **THEN** no access check is made and the generic error toast is shown

### Requirement: Site access toast
Without access, the client SHALL show an error toast that names the application's host and offers an "Allow access" action, instead of the generic error toast. The client SHALL still go on as a guest behind it.

#### Scenario: Toast content
- **WHEN** the client finds no access to `app.thepund.it` after a failed session lookup
- **THEN** an error toast says that Pundit cannot reach `app.thepund.it`
- **AND** it offers an "Allow access" action

### Requirement: Granting access from the PDF viewer
In the extension's PDF viewer, the "Allow access" action SHALL ask the browser for access to the application's origin only, in the click and never on its own, and SHALL reload the viewer when access is granted. When it is refused, nothing SHALL change.

#### Scenario: User allows in the viewer
- **WHEN** the user clicks "Allow access" in the viewer and accepts the browser's prompt
- **THEN** the viewer reloads and the session lookup succeeds

### Requirement: Granting access from a web page
On a web page, where the page cannot ask the browser for permissions, the "Allow access" action SHALL open a small extension window that names the application's host and offers an "Allow access" button. The button SHALL ask the browser for access to the application's origin only. When access is granted, the window SHALL close and the web page SHALL reload. When it is refused, the window SHALL stay open and can be closed by the user.

#### Scenario: User allows from a web page
- **WHEN** the user clicks "Allow access" in the toast on `https://example.com/`, then the button in the extension window, and accepts the browser's prompt
- **THEN** the extension window closes and `https://example.com/` reloads with Pundit active

#### Scenario: User refuses from a web page
- **WHEN** the user refuses the browser's prompt in the extension window
- **THEN** the window stays open and the web page is unchanged
