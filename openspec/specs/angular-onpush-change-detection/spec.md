# angular-onpush-change-detection Specification

## Purpose

Define how Angular components use OnPush change detection across the Pundit client, including immutable state updates, explicit view refreshes, and bringing out-of-zone changes back into change detection.

## Requirements

### Requirement: OnPush change detection for all components

Every component SHALL declare `changeDetection: ChangeDetectionStrategy.OnPush`.

#### Scenario: Component uses OnPush
- **WHEN** a component is defined
- **THEN** its `@Component` decorator sets `changeDetection: ChangeDetectionStrategy.OnPush`

#### Scenario: No component relies on Default re-checks
- **WHEN** the migration is complete
- **THEN** no component depends on `Default` change detection to refresh its view
- **AND** views update correctly under OnPush in both chrome-extension and embed runtime modes

### Requirement: Immutable updates for bound state

Template-bound and `@Input` state SHALL be updated by reassignment (new object/array references) rather than in-place mutation, so OnPush detects the change.

#### Scenario: Collection update creates a new reference
- **WHEN** a component changes a template-bound array or object
- **THEN** it assigns a new reference (e.g. spread/`map`/filter) instead of mutating in place via `push`/`splice`/property writes

#### Scenario: Parent updates a child input immutably
- **WHEN** a parent changes data passed to a child `@Input`
- **THEN** it passes a new reference so the OnPush child re-renders
- **AND** the child does not depend on the parent mutating the existing input object in place

### Requirement: Explicit view refresh

View refreshes SHALL be triggered explicitly via the `async` pipe, `ChangeDetectorRef.markForCheck()`, or signals. Synchronous `detectChanges()` is used only where eager detection is genuinely required.

#### Scenario: Observable rendered via async pipe
- **WHEN** a template binds to an observable value
- **THEN** it uses the `async` pipe, or the component calls `markForCheck()` after assigning the emitted value

#### Scenario: markForCheck preferred over detectChanges
- **WHEN** a component needs its view re-checked after a state change
- **THEN** it calls `markForCheck()` unless a documented reason requires synchronous `detectChanges()`

### Requirement: Out-of-zone changes re-enter change detection

State changes originating outside Angular's zone (ProseMirror transactions, chrome-extension messaging, `setTimeout`/`setInterval`, `postMessage`/DOM events) SHALL be brought back into change detection deliberately.

#### Scenario: Non-Angular callback updates the view
- **WHEN** a callback from outside Angular's zone updates component state
- **THEN** the update is wrapped in `NgZone.run()`, emitted through an observable consumed by the `async` pipe, or followed by an explicit `markForCheck()`
- **AND** the view reflects the change without requiring an unrelated event to trigger detection

#### Scenario: Editor content flows into the view
- **WHEN** the ProseMirror editor dispatches a transaction that changes content
- **THEN** the resulting Angular state update triggers an OnPush refresh of the affected view
