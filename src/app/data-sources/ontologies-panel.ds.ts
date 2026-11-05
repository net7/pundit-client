import { DataSource, _t } from '@net7/core';
import { OntologySummary } from 'src/communication';
import {
  ONTOLOGY_CATEGORIES, OntologyListStatus, getAvailableCategories, getOntologySourceLabel
} from 'src/app/services/ontology.service';
import { OntologiesPanelData } from '../components/ontologies-panel/ontologies-panel';

export type OntologiesPanelInput = {
  ontologies: OntologySummary[];
  status: OntologyListStatus;
  ontologiesLink?: string;
  savingIds?: string[];
};

export class OntologiesPanelDS extends DataSource {
  protected transform({
    ontologies, status, ontologiesLink, savingIds = []
  }: OntologiesPanelInput): OntologiesPanelData {
    return {
      status,
      ontologiesLink,
      // an ontology with no element in any category cannot be used: not listed
      items: ontologies.filter((ontology) => getAvailableCategories(ontology).length > 0).map((ontology) => ({
        id: ontology.id,
        name: ontology.name,
        sourceLabel: ontology.prefix && ontology.prefix !== ontology.name ? ontology.prefix : undefined,
        shared: !!ontology.shared,
        types: ONTOLOGY_CATEGORIES.map((type) => {
          const count = ontology.counts?.[type] || 0;
          return {
            type,
            count,
            // a category without elements stays unchecked and cannot be checked
            disabled: count === 0,
            active: count > 0 && ontology.selectedCategories.includes(type),
            title: count > 0
              ? _t(`ontologiespanel#use_${type}`, { ontology: getOntologySourceLabel(ontology) })
              : _t(`ontologiespanel#no_${type}`),
          };
        }),
        selected: ontology.selected,
        isSaving: savingIds.includes(ontology.id),
      })),
      labels: {
        title: _t('ontologiespanel#title'),
        description: _t('ontologiespanel#description'),
        empty: _t('ontologiespanel#empty'),
        emptyLink: _t('ontologiespanel#empty_link'),
        error: _t('ontologiespanel#error'),
        saving: _t('ontologiespanel#saving'),
        shared: _t('ontologiespanel#shared'),
        sharedTitle: _t('ontologiespanel#shared_title'),
        typeNames: {
          entity: _t('semantic#type_entity'),
          class: _t('semantic#type_class'),
          predicate: _t('semantic#type_predicate'),
        },
      },
    };
  }
}
