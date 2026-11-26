## ADDED Requirements

### Requirement: Discard single triple of a semantic preview
An expanded AI preview card (id prefixed `ai-preview-`) of type `Linking` with more than one triple SHALL show a Discard triple button (✕) on each triple of its semantic section. Clicking it SHALL remove only that triple from the preview: the card SHALL re-render without it, the other triples SHALL stay in their order, and the payload kept for "Save all" SHALL no longer contain it. The click SHALL NOT collapse the card.

#### Scenario: Discard one of several triples
- **WHEN** a semantic preview shows triples A, B and C and the user clicks ✕ on B
- **THEN** the card shows only A and C, in this order
- **AND** the preview highlight and the other previews stay unchanged

#### Scenario: Triples grouped by subject
- **WHEN** a semantic preview groups its triples under "About" subjects and the user discards the only triple of one subject group
- **THEN** that subject group disappears from the card and the other groups stay

#### Scenario: Card stays expanded
- **WHEN** the user clicks ✕ on a triple
- **THEN** the card remains expanded

### Requirement: Last triple of a preview cannot be discarded alone
When an AI semantic preview has exactly one triple, its semantic section SHALL NOT show the Discard triple button. The preview SHALL be dropped only through the card Discard button.

#### Scenario: One triple left
- **WHEN** the user discards triples until one remains
- **THEN** no ✕ is shown on the remaining triple
- **AND** the ✕ Discard button of the card header is still shown

#### Scenario: Preview generated with one triple
- **WHEN** an AI semantic preview is generated with a single triple
- **THEN** its semantic section shows no Discard triple button

### Requirement: Save all keeps only remaining triples
"Save all" in the AI modal SHALL save each remaining preview with only the triples not discarded.

#### Scenario: Save after discarding triples
- **WHEN** the user discards one of three triples of a preview and clicks "Save all"
- **THEN** the saved annotation contains exactly the two remaining triples

### Requirement: No triple discard on saved annotations
The semantic section of an annotation whose id is not an AI preview id SHALL NOT show the Discard triple button.

#### Scenario: Saved semantic annotation
- **WHEN** the user expands a saved semantic annotation with several triples
- **THEN** no ✕ is shown on its triples
