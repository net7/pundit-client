## Why

In the semantic annotation modal the predicate field looks like a select (label + chevron), but on focus it opens an empty list with a "type to search" hint. Users do not see what the field contains, nor that it is an autocomplete. Showing some real predicates right away makes both clear and, with small ontologies, lets the user pick without typing.

## What Changes

- On focus (or chevron click) with an empty query, the predicate dropdown shows the **first 10 predicates** of the ontologies used for predicates, ordered by label, instead of the hint.
- Under that list, when the selected ontologies hold more predicates than shown, a footer reads "Type to search among N predicates" (N from the ontology counts the client already has).
- Typing keeps the current search; clearing the text goes back to the first 10, not to the hint.
- The first 10 are fetched once and reused by every row; they are fetched again only after the ontology selection changes.
- If the request fails or returns nothing (e.g. the server does not accept an empty query yet), the dropdown falls back to today's hint.
- The object field is unchanged.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `semantic-ontology-terms`: the "Predicate autocomplete" requirement changes its empty-field behaviour (first predicates + total footer instead of a hint, with the hint as fallback).

## Impact

- `src/app/components/edit-modal/sections/semantic-section/` (component, template, utils, specs).
- `src/app/services/ontology.service.ts`: total of predicates of the selected ontologies; `search` gains an optional `limit`.
- i18n: one new label for the footer.
- Server: `GET /ontologies/elements` must accept an empty `q` and return the first elements ordered by label (requested separately). Until then the client degrades to the hint.
