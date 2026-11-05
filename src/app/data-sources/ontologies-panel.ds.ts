import { DataSource, _t } from '@net7/core';
import { OntologySummary } from 'src/communication';
import {
  ONTOLOGY_CATEGORIES, OntologyListStatus, getAvailableCategories, getOntologySourceLabel
} from 'src/app/services/ontology.service';
import { OntologiesPanelData, OntologiesPanelItem } from '../components/ontologies-panel/ontologies-panel';

export type OntologiesPanelInput = {
  ontologies: OntologySummary[];
  status: OntologyListStatus;
  ontologiesLink?: string;
  savingIds?: string[];
};

const toItem = (ontology: OntologySummary, savingIds: string[]): OntologiesPanelItem => ({
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
});

export class OntologiesPanelDS extends DataSource {
  protected transform({
    ontologies, status, ontologiesLink, savingIds = []
  }: OntologiesPanelInput): OntologiesPanelData {
    // an ontology with no element in any category cannot be used: not listed
    const usable = ontologies.filter((ontology) => getAvailableCategories(ontology).length > 0);
    const own = usable.filter(({ shared }) => !shared);
    const shared = usable.filter(({ shared: isShared }) => isShared);
    return {
      status,
      ontologiesLink,
      // the user's ontologies first, then the built-in ones, each in the server order
      items: [...own, ...shared].map((ontology) => toItem(ontology, savingIds)),
      hasOwn: own.length > 0,
      labels: {
        title: _t('ontologiespanel#title'),
        description: _t('ontologiespanel#description'),
        importSection: _t('ontologiespanel#import_title'),
        importButton: _t('ontologiespanel#import'),
        importDescription: _t('ontologiespanel#import_description'),
        listSection: _t('ontologiespanel#list_title'),
        ownEmpty: _t('ontologiespanel#own_empty'),
        sharedBadge: _t('ontologiespanel#shared_badge'),
        sharedTitle: _t('ontologiespanel#shared_title'),
        error: _t('ontologiespanel#error'),
        saving: _t('ontologiespanel#saving'),
        typeNames: {
          entity: _t('semantic#type_entity'),
          class: _t('semantic#type_class'),
          predicate: _t('semantic#type_predicate'),
        },
      },
    };
  }
}
