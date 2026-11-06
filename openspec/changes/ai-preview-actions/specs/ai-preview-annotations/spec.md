## ADDED Requirements

### Requirement: Preview annotations expose no backend actions
A sidebar annotation card whose id is an AI preview id (prefix `ai-preview-`) SHALL NOT show the actions menu (edit, add comment/semantic/tags, change notebook, delete), the share button or the social section (likes, replies). The collapse control SHALL remain available.

#### Scenario: Expanded preview card
- **WHEN** the user expands an AI preview card in the sidebar
- **THEN** the card shows no ⋮ menu button, no share button and no social bar or replies
- **AND** the collapse button is shown

#### Scenario: Saved annotation keeps its actions
- **WHEN** the user expands a saved annotation they own
- **THEN** the ⋮ menu, share button (public notebook) and social section are shown as before

### Requirement: Discard a single preview
An expanded AI preview card SHALL show a Discard button (✕) in place of the actions menu. Clicking it SHALL remove only that preview: its highlight anchor in the page, its card in the sidebar and its payload from the set to be saved. The click SHALL NOT collapse the card.

#### Scenario: Discard one of several previews
- **WHEN** three previews are shown and the user clicks Discard on the second one
- **THEN** the second preview's highlight and card are removed
- **AND** the first and third previews stay visible and unchanged

#### Scenario: Discard button in place of the menu
- **WHEN** the user expands an AI preview card
- **THEN** the header shows the ✕ Discard button where saved annotations show the ⋮ menu

### Requirement: Save all reflects the remaining previews
"Save all" in the AI modal SHALL save only the previews not discarded. When no preview remains, "Save all" SHALL be disabled and the sidebar SHALL refresh as when previews are cleared.

#### Scenario: Save after discarding
- **WHEN** the user discards one of three previews and clicks "Save all"
- **THEN** exactly the two remaining previews are saved

#### Scenario: Discard the last preview
- **WHEN** the user discards the only remaining preview
- **THEN** "Save all" becomes disabled
- **AND** the user can generate new previews from the same modal

#### Scenario: Cancel after discarding
- **WHEN** the user discards some previews and then closes the AI modal with Cancel
- **THEN** all remaining previews are removed from the page and the sidebar
