## ADDED Requirements

### Requirement: Tab kinds
The extension's background SHALL classify a tab from its URL before acting on it, in this order:

- `viewer`: the extension's own `pdf-viewer.html`;
- `feed-web`: a URL starting with the feed's web base URL;
- `feed-pdf`: a URL starting with the feed's PDF base URL;
- `web`: any other `http:`, `https:` or `file:` URL, except the browsers' extension stores;
- `unsupported`: everything else, including a missing or unparsable URL, any browser scheme (`chrome:`, `edge:`, `brave:`, `opera:`, `vivaldi:`, `about:`, …), `view-source:`, `data:`, other `chrome-extension:` pages and the extension stores, where browsers do not run content scripts (`chromewebstore.google.com`, `chrome.google.com/webstore`, `microsoftedge.microsoft.com/addons`).

The supported schemes SHALL be listed explicitly, so that the scheme of any Chromium-based browser is `unsupported` without naming it.

#### Scenario: Browser page
- **WHEN** a tab shows `chrome://extensions`
- **THEN** its kind is `unsupported`

#### Scenario: Chrome Web Store
- **WHEN** a tab shows `https://chromewebstore.google.com/detail/…`
- **THEN** its kind is `unsupported`

#### Scenario: Edge page
- **WHEN** a tab shows `edge://newtab`
- **THEN** its kind is `unsupported`

#### Scenario: Website
- **WHEN** a tab shows `https://example.com/`
- **THEN** its kind is `web`

#### Scenario: PDF viewer
- **WHEN** a tab shows `chrome-extension://<id>/pdf-viewer.html?source=…`
- **THEN** its kind is `viewer`

#### Scenario: Tab without URL yet
- **WHEN** a tab has just been created and has no URL
- **THEN** its kind is `unsupported` until an update gives it one

### Requirement: Unsupported tabs
On an `unsupported` tab the background SHALL NOT fetch its URL, SHALL NOT send it any message, SHALL NOT redirect it and SHALL NOT store an active state for it. The extension's action SHALL be disabled on that tab, showing the inactive icon with no badge, so that a click on it does nothing. The action SHALL be enabled again when the tab's kind becomes supported.

#### Scenario: Visiting a browser page
- **WHEN** the user opens `chrome://extensions`
- **THEN** the background makes no request and sends no message for that tab
- **AND** the Pundit icon on that tab is greyed out and does nothing when clicked

#### Scenario: Leaving a browser page
- **WHEN** a tab on `chrome://newtab` navigates to `https://example.com/`
- **THEN** the Pundit icon on that tab is enabled again, in the inactive state

#### Scenario: Click on an unsupported tab
- **WHEN** a click on the action reaches the background for an `unsupported` tab
- **THEN** no active state is stored and the tab stays inactive

### Requirement: Activation on supported tabs
On a `web`, `viewer`, `feed-web` or `feed-pdf` tab, a click on the extension's action SHALL toggle the tab's active state, as today, and the icon and badge SHALL show that state.

#### Scenario: Activating Pundit on a website
- **WHEN** the user clicks the icon on `https://example.com/` while Pundit is inactive there
- **THEN** the tab's active state is stored and the icon shows Pundit as active

### Requirement: PDF detection and redirects
The background SHALL check whether a `web` tab is a PDF only for `http:` and `https:` URLs not containing `.pdf`, reading the response headers and aborting the download as soon as they arrive; a URL containing `.pdf` SHALL count as a PDF without a request. An active `web` tab that is a PDF SHALL be redirected to the viewer. An inactive `viewer` tab SHALL be redirected to the original document. `feed-web` and `feed-pdf` tabs SHALL keep today's redirects.

#### Scenario: Active PDF without extension in the URL
- **WHEN** Pundit is active on a tab that opens `https://arxiv.org/pdf/1706.03762`, answered with `Content-Type: application/pdf`
- **THEN** the tab is redirected to the viewer with that URL as `source`

#### Scenario: Deactivating Pundit in the viewer
- **WHEN** the user clicks the icon in the viewer while Pundit is active
- **THEN** the tab is redirected to the original document

### Requirement: State message to the content script
The background SHALL send the active state (`StateChanged`) only to `web` tabs, where the content script runs. A missing receiver (a page still loading, a page where the content script is not allowed) SHALL be handled without an error. The viewer SHALL NOT receive the message.

#### Scenario: Website
- **WHEN** a `web` tab is activated or finishes loading
- **THEN** its content script receives `StateChanged` with the tab's active state

#### Scenario: Viewer
- **WHEN** a `viewer` tab is activated or finishes loading
- **THEN** no `StateChanged` message is sent to it

### Requirement: Tab updates acted on
The background SHALL act on a tab update only when the tab's URL changes or its page finishes loading (`status: 'complete'`). Tab creation and activation SHALL still be acted on.

#### Scenario: Intermediate update
- **WHEN** a tab update only changes its title or favicon
- **THEN** the background does not check the tab again

#### Scenario: Page loaded
- **WHEN** a tab update reports `status: 'complete'`
- **THEN** the background checks the tab
