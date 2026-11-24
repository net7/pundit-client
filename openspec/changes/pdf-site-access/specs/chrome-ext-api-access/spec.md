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
Without access, the client SHALL show an error toast asking for the user's permission, without naming hosts or permissions, and offering an "Allow" action, instead of the generic error toast. The client SHALL still go on as a guest behind it.

#### Scenario: Toast content
- **WHEN** the client finds no access to the application's site after a failed session lookup
- **THEN** an error toast titled "Pundit needs your permission" says "Pundit can't connect to your annotations. Allow it to continue."
- **AND** it offers an "Allow" action

### Requirement: Granting access from the PDF viewer
In the extension's PDF viewer, the "Allow" action SHALL ask the browser for access to the application's origin only, in the click and never on its own, and SHALL reload the viewer when access is granted. When it is refused, nothing SHALL change.

#### Scenario: User allows in the viewer
- **WHEN** the user clicks "Allow" in the viewer and accepts the browser's prompt
- **THEN** the viewer reloads and the session lookup succeeds

### Requirement: Granting access from a web page
On a web page, where the page cannot ask the browser for permissions, the "Allow" action SHALL open an extension page in a new tab right after the web page's tab, asking for the same permission ("Allow Pundit to connect") with an "Allow" button. The button SHALL ask the browser for access to the application's origin only. When access is granted, the extension tab SHALL close and the web page SHALL reload and come to the front. When it is refused, the extension tab SHALL stay open and can be closed by the user.

#### Scenario: User allows from a web page
- **WHEN** the user clicks "Allow" in the toast on `https://example.com/`, then the button in the extension tab, and accepts the browser's prompt
- **THEN** the extension tab closes and `https://example.com/` reloads in front, with Pundit active

#### Scenario: User refuses from a web page
- **WHEN** the user refuses the browser's prompt in the extension tab
- **THEN** the extension tab stays open and the web page is unchanged
