import { _t } from '@net7/core';
import { _c } from 'src/app/models/config';
import { OntologyService } from 'src/app/services/ontology.service';
import { ToastService } from 'src/app/services/toast.service';

const IMPORT_ACTION = 'importontologies';
const SELECT_ACTION = 'selectontologies';

/**
 * Semantic annotations need predicates from the selected ontologies. When the
 * semantic section opens and no ontology is used for predicates, warn the user
 * who imported no ontology of their own (button to the ontologies page) or who
 * has some but none used for predicates (button to the panel). Shared ontologies
 * provided by Pundit count as selected, not as imported.
 * Nothing is shown while the list is not loaded or failed to load.
 */
export const warnIfNoOntologyPredicates = (
  ontologyService: OntologyService,
  toastService: ToastService,
) => {
  if (ontologyService.status$.value !== 'loaded' || ontologyService.hasSelection(['predicate'])) {
    return;
  }
  if (!ontologyService.hasImportedOntologies()) {
    const link = _c('ontologiesLink');
    toastService.warn({
      title: _t('toast#ontologies_missing_title'),
      text: _t('toast#ontologies_missing_text'),
      autoClose: false,
      actions: link ? [{ text: _t('toast#ontologies_missing_action'), payload: IMPORT_ACTION }] : [],
      onAction: (payload, toast) => {
        if (payload === IMPORT_ACTION) {
          window.open(link, '_blank', 'noopener');
          toast.close();
        }
      },
    });
    return;
  }
  toastService.warn({
    title: _t('toast#ontologies_no_predicates_title'),
    text: _t('toast#ontologies_no_predicates_text'),
    autoClose: false,
    actions: [{ text: _t('toast#ontologies_no_predicates_action'), payload: SELECT_ACTION }],
    onAction: (payload, toast) => {
      if (payload === SELECT_ACTION) {
        ontologyService.openPanel$.next();
        toast.close();
      }
    },
  });
};
