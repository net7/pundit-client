## ADDED Requirements

### Requirement: Site access check on a load failure
When a document fails to load in the extension's PDF viewer and its source is an `http:` or `https:` URL, the viewer SHALL check whether the extension has access to the source's origin (`<origin>/*`). The check SHALL run only where the extension permissions API is available, so the web viewer (feed) SHALL keep the generic error page.

#### Scenario: Access withheld
- **WHEN** the user has set the extension's site access to "On specific sites" without `www.w3.org`
- **AND** the viewer fails to load `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`
- **THEN** the viewer finds that Pundit has no access to `https://www.w3.org`

#### Scenario: Access granted, other failure
- **WHEN** Pundit has access to all sites and the source answers 404
- **THEN** the viewer shows the generic error page

#### Scenario: Web viewer
- **WHEN** a document fails to load in the web viewer served by the feed
- **THEN** no access check is made and the generic error page is shown

### Requirement: Error page for a site without access
Without access, the error page SHALL say that Pundit cannot access the document's site, naming its host, and SHALL offer two actions: a button to allow access to that site, and the existing link that opens the original document in a new tab.

#### Scenario: Page content
- **WHEN** the viewer finds no access to `https://www.w3.org` after a load failure
- **THEN** the page reads that Pundit cannot access `www.w3.org`
- **AND** it shows an "Allow access to www.w3.org" button and the "Open the original document" link

### Requirement: Granting access from the viewer
The allow button SHALL ask the browser for access to the source's origin only (`<origin>/*`), on the user's click and never on its own. When access is granted, the viewer SHALL reload and open the document. When it is refused, or the request fails, the page SHALL stay as it is.

#### Scenario: User allows access
- **WHEN** the user clicks "Allow access to www.w3.org" and accepts the browser's prompt
- **THEN** the viewer reloads and the PDF is shown

#### Scenario: User refuses
- **WHEN** the user clicks the button and refuses the browser's prompt
- **THEN** the error page stays, with both actions
