## Why

The server now offers every user a shared ontology, "Pundit predicates", holding the nine relations the annotator always had (same URIs as the client's static predicate list). It is listed with the user's own ontologies, selected by default until the user saves a selection, and cannot be deleted or edited. The client must tell it apart from the user's own ontologies, keep working with it like any other, and still invite the user to import ontologies of their own.

## What Changes

- Ontology summaries from `GET /ontologies` carry an optional boolean `shared` (missing means `false`).
- The Ontologies panel is organised in sections, like the notebook panel:
  - **Import ontologies**: a "+ Import an ontology" button to the import page and a description under it (only when the import page is configured).
  - **Available ontologies**: the user's ontologies first, then the shared ones, each marked with a **Built-in** badge (tooltip "Provided by Pundit to every user: it cannot be edited or deleted"). When the user imported none, a "You haven't imported any ontology yet." line opens the list.
- Checkboxes, categories and saving work the same for shared ontologies; a shared ontology's id is sent in the selection when checked.
- One warning toast, "No predicates selected", with a single "Select ontologies" button opening the Ontologies panel, where ontologies are selected and imported. The "No ontologies yet" toast is removed.
- No change to the predicate picker, the object search, `SemanticPredicateModel` or the AI label-to-URI mapping: they already follow what the selection API returns.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `semantic-ontologies-panel`: import section, single list with built-in ontologies marked (added requirements).
- `semantic-ontology-terms`: a single "no predicates" warning toast opening the panel (added requirement).

## Impact

- Affected code: `src/communication/model/entity/ontology.ts`, `ontologies-panel.ds.ts`, `ontologies-panel.ts/html`, `_ontologies-panel.scss`, `en_US.ts`, `ontology.service.ts` (`hasUsableOntologies` removed, no longer used), `ontologies-warning-toast.util.ts`, specs.
- Server: already provides `shared`. A saved selection, empty included, is returned as saved; the default (shared ontology selected) applies only to a user who never saved one.
