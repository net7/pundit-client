## ADDED Requirements

### Requirement: Exclusive sidebar tabs
The sidebar header tabs (notebooks, ontologies, page annotations) SHALL behave as exclusive tabs: opening one SHALL close the other open one. Clicking the active tab SHALL close it.

#### Scenario: Open page annotations with a panel open
- **WHEN** the notebook or ontologies panel is open and the user clicks the page annotations tab
- **THEN** the page annotations are shown
- **AND** the notebook and ontologies panels are closed

#### Scenario: Open a panel with page annotations shown
- **WHEN** the page annotations are shown and the user clicks the notebooks or ontologies tab
- **THEN** that panel opens
- **AND** the page annotations are hidden

#### Scenario: Notebooks and ontologies
- **WHEN** one of the notebook and ontologies panels is open and the user clicks the other tab
- **THEN** the other panel opens and the first one closes

#### Scenario: Close the active tab
- **WHEN** the user clicks the active tab
- **THEN** that tab closes and no other tab opens

### Requirement: Sidebar header order
The sidebar header SHALL show its actions in this order: notifications, notebooks, ontologies, page annotations, close. Actions reserved to logged users (notifications, notebooks, ontologies, close) SHALL be left out for anonymous users.

#### Scenario: Logged user
- **WHEN** a logged user opens the sidebar
- **THEN** the header shows notifications, notebooks, ontologies, page annotations, close, in this order

#### Scenario: Anonymous user
- **WHEN** an anonymous user opens the sidebar
- **THEN** the header shows only the page annotations tab

### Requirement: Page annotations tab icon
The page annotations tab SHALL show a page with a speech bubble.

#### Scenario: Header icon
- **WHEN** the sidebar header is shown
- **THEN** the page annotations tab shows the page with speech bubble icon

### Requirement: Add Page Annotation buttons
With the page annotations shown, the sidebar SHALL show an "Add Page Annotation" bar at the top of its content with one always visible button per annotation type: Tag, Comment, Semantic, AI. Each button SHALL show the full type name as its title. Clicking a button SHALL start a new page annotation of that type. The bar SHALL NOT cover the page annotations.

#### Scenario: Create a page annotation
- **WHEN** page annotations are shown and the user clicks "Semantic"
- **THEN** a new semantic page annotation starts

#### Scenario: Annotations below the bar
- **WHEN** page annotations are shown
- **THEN** the first page annotation starts below the bar
