## 1. Ontology service

- [x] 1.1 Add an optional `limit` argument to `OntologyService.search` and forward it to `OntologyModel.searchElements`
- [x] 1.2 Add `OntologyService.getElementCount(category)` summing `counts[category]` over ontologies whose `selectedCategories` include it
- [x] 1.3 Unit tests for both (limit forwarded / omitted; count with mixed selections)

## 2. Semantic section

- [x] 2.1 Add `PREDICATE_DEFAULT_LIMIT = 10` and make `getPredicateOptions` return the shared defaults when the row query is empty
- [x] 2.2 Add the shared `defaultPredicates` state (options, status) and lazy load it on the first open of an empty predicate field (focus, chevron, clearing the text), reusing an in-flight request
- [x] 2.3 Reset the cache when the set of ontologies used for predicates changes; reload if an empty field is open
- [x] 2.4 Template: loader while defaults load; footer "Type to search among N predicates" when total > shown; hint when nothing is used for predicates, or the request failed or returned nothing
- [x] 2.5 Add the `editmodal#semantic_predicate_total` label to `en_US.ts`

## 3. Tests and checks

- [x] 3.1 Component specs: defaults on focus, footer shown/hidden, reuse across rows, refresh after selection change, back to defaults after clearing, fallback to hint on failure/empty, pick a default option
- [x] 3.2 Run lint, typecheck and the unit test suite
- [x] 3.3 Check the modal in the browser against the server answering empty queries
