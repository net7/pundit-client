import { _t } from '@net7/core';
import { OntologyService } from 'src/app/services/ontology.service';
import { ToastParams, ToastService } from 'src/app/services/toast.service';

const SELECT_ACTION = 'selectontologies';

/**
 * "Select ontologies" button opening the Ontologies panel, where ontologies are
 * selected and imported; the toast stays open so the user has time to click it.
 */
export const getOntologiesToastParams = (ontologyService: OntologyService): ToastParams => ({
  autoClose: false,
  actions: [{ text: _t('toast#ontologies_no_predicates_action'), payload: SELECT_ACTION }],
  onAction: (payload, toast) => {
    if (payload === SELECT_ACTION) {
      ontologyService.openPanel$.next();
      toast.close();
    }
  },
});

/**
 * Semantic annotations need predicates from the selected ontologies. When the
 * semantic section opens and no ontology is used for predicates, warn the user
 * with a button to the Ontologies panel.
 * Nothing is shown while the list is not loaded or failed to load.
 */
export const warnIfNoOntologyPredicates = (
  ontologyService: OntologyService,
  toastService: ToastService,
) => {
  if (ontologyService.status$.value !== 'loaded' || ontologyService.hasSelection(['predicate'])) {
    return;
  }
  toastService.warn({
    title: _t('toast#ontologies_no_predicates_title'),
    text: _t('toast#ontologies_no_predicates_text'),
    ...getOntologiesToastParams(ontologyService),
  });
};
