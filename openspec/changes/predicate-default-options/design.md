## Context

`SemanticSectionComponent` renders one predicate combobox per row. Each row keeps its own predicate state (`query`, `remote`, `searched`, `isLoading`, `isExpanded`). Searches go through a debounced `predicateSearch$` stream that calls `OntologyService.search(query, ['predicate'])`, which waits for any pending selection save before calling `GET /ontologies/elements?q=&categories=&limit=` (default limit 20). With an empty query nothing is searched and the template shows `editmodal#semantic_predicate_hint`.

`OntologyService.ontologies$` already holds each ontology's `counts` per category and its `selectedCategories`, so the client can compute the total predicates in scope without a request.

The server may not accept an empty `q` yet; that change is requested separately.

This change modifies the "Predicate autocomplete" requirement introduced by the `semantic-ontologies` change, so it must be archived after that one.

## Goals / Non-Goals

**Goals:**
- Show the first 10 predicates (ordered by label, server side) when the predicate field opens empty.
- Show "Type to search among N predicates" when more exist.
- One request shared by all rows, refreshed only when the ontology selection changes.
- Graceful fallback to the current hint when the server does not support it or returns nothing.

**Non-Goals:**
- Any change to the object field.
- Client-side sorting or paging ("load more") of the first predicates.
- Changing the search for non-empty queries.

## Decisions

1. **Shared cache in the component, not per row.** A single `defaultPredicates` state (`options`, `status: 'idle' | 'loading' | 'loaded' | 'failed'`) lives on the component. Rows read from it when their query is empty. Alternative: storing it in each row's `remote` — rejected, it would duplicate data and requests across rows.

2. **Lazy load on first open.** The request starts the first time an empty predicate field is opened (focus or chevron, or clearing the text), not when the modal opens, so modals where the predicate is never touched cost nothing. A loader is shown meanwhile. Concurrent opens reuse the in-flight request.

3. **Invalidate on selection change.** The component subscribes to `OntologyService.ontologies$` and resets the cache to `idle` when the set of ontologies used for predicates changes (compared by a key of ids with `predicate` among their categories). If an empty field is open at that moment, it reloads. `search` already flushes pending selection saves, so the server sees the new selection.

4. **`search` gains an optional `limit`.** `OntologyService.search(query, categories, limit?)` forwards it to `OntologyModel.searchElements`. The first predicates use `limit = 10` (`PREDICATE_DEFAULT_LIMIT` in the utils). Normal searches keep the current default.

5. **Total from counts.** `OntologyService.getElementCount(category)` sums `counts[category]` over ontologies whose `selectedCategories` include it. The footer shows only when `total > options.length`. Alternative: asking the server for a total — rejected, the data is already on the client.

6. **Fallback.** A failed request or an empty result set the cache to `failed`/empty and the template shows the existing hint. Failure is not retried until the selection changes or the modal is reopened, to avoid hammering a server that rejects empty queries.

7. **Template rendering.** `getPredicateOptions(row, defaults)` returns the row's `remote` results when the row has a query, otherwise the cached defaults (with `selected` set as today). Enter on an empty query still picks nothing.

## Risks / Trade-offs

- [Server keeps rejecting empty `q`] → the client shows the hint, as today; no regression.
- [Server returns unordered results] → the list looks random; ordering is in the server request, the client does not re-sort so it matches whatever ranking the server defines.
- [Counts stale vs. server] → N is indicative only; it comes from the same list the panel shows.
- [Shared ontologies listed with counts] → included in N exactly like user ontologies when selected for predicates.
