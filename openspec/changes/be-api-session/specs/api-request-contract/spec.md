## ADDED Requirements

### Requirement: No userId in request bodies
The client SHALL NOT send `userId` in any annotation, notebook, reply or social request body. The author or owner is the signed-in user.

#### Scenario: Creating an annotation
- **WHEN** the user saves a new annotation
- **THEN** `POST /api/annotation` is sent without `userId`

#### Scenario: Reacting
- **WHEN** the user likes an annotation
- **THEN** `POST /api/social/do` is sent without `userId`

### Requirement: Notebook bodies carry only label and sharing mode
Notebook create and update SHALL send only `label` and `sharingMode`, whatever object the app builds. Sharing SHALL go only through the share, remove-share and notify-share routes.

#### Scenario: Renaming a shared notebook
- **WHEN** the user renames a notebook shared with someone
- **THEN** `PUT /api/notebook/{id}` is sent with exactly `{label, sharingMode}`
- **AND** the notebook is still shared afterwards

#### Scenario: Creating a notebook
- **WHEN** the user creates a notebook
- **THEN** `POST /api/notebook` is sent with exactly `{label, sharingMode}`

### Requirement: Reply bodies carry no parentId
Reply create and update SHALL NOT send `parentId`. Reply update SHALL send `comment`, plus `type` and the unchanged `annotationId` when present. Reactions on a reply SHALL keep sending `parentId` on `social/do` and `social/undo`, where it names the reply.

#### Scenario: Editing a reply
- **WHEN** the user edits a reply
- **THEN** `PUT /api/reply/{id}` is sent with `{comment, type, annotationId}` and no `parentId` or `userId`

#### Scenario: Reacting to a reply
- **WHEN** the user likes a reply
- **THEN** `POST /api/social/do` carries the reply's id as `parentId`

### Requirement: Paging by page and size
Searches SHALL page with `page`, counting from 1, and `size`. The client SHALL NOT send `from`. The sidebar search SHALL ask for page 1 with size 200, and the notebook list for page 1 with size 50.

#### Scenario: Sidebar search
- **WHEN** the sidebar loads a page's annotations
- **THEN** `POST /api/annotation/search` carries `page: 1, size: 200` and no `from`

#### Scenario: Notebook list
- **WHEN** the notebook list loads
- **THEN** `POST /api/notebook/search` carries `page: 1, size: 50` and no `from`

### Requirement: Write responses
The client SHALL read a write's response through its `id`, whether the new BE API answers with the full resource or with `{id}`.

#### Scenario: Create answers the resource
- **WHEN** `POST /api/annotation` answers 201 with the annotation
- **THEN** the client reads its `id` as it read `{id}` before, and the annotation appears in the sidebar

### Requirement: Identifiers starting with a digit
The client SHALL handle ids that start with a digit wherever it looks an element up by id. It SHALL NOT build `#<id>` CSS selectors from backend ids.

#### Scenario: Replying to an annotation with a ULID
- **WHEN** the user saves a reply to an annotation whose id starts with a digit
- **THEN** the reply form closes, the loading state ends and the reply count increases

### Requirement: Public search for the extension badge
The extension's badge count SHALL search the page's annotations with the `anonymous` option: no cookies and no CSRF token. It SHALL keep its cache. A failure SHALL be caught and logged in the service worker, leaving the badge empty, and SHALL NOT affect the user's session.

#### Scenario: Badge request
- **WHEN** Pundit is off on a page and the extension computes its badge
- **THEN** the search is sent without cookies and without `X-CSRF-TOKEN`
- **AND** the user's stored CSRF token and session are untouched

#### Scenario: Badge request refused
- **WHEN** the badge search fails
- **THEN** a warning is logged in the service worker and the badge stays empty
