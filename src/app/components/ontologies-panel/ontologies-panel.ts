import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OntologyElementCategory } from 'src/communication';
import { OntologyListStatus } from 'src/app/services/ontology.service';
import { SvgIconComponent } from '../svg-icon/svg-icon';

export type OntologiesPanelType = {
  type: OntologyElementCategory;
  /** Whether the category of this ontology is used in the annotator. */
  active: boolean;
  /** Number of elements of the category in the ontology. */
  count: number;
  /** No elements: the category cannot be checked. */
  disabled: boolean;
  /** Tooltip, e.g. "Use classes from foaf". */
  title: string;
};

export type OntologiesPanelItem = {
  id: string;
  name: string;
  /** Prefix shown under the name, when different from the name. */
  sourceLabel?: string;
  /** Shared ontology provided by Pundit to every user: marked as built-in. */
  shared: boolean;
  types: OntologiesPanelType[];
  selected: boolean;
  /** The change of this ontology is being saved: its controls wait. */
  isSaving: boolean;
};

export type OntologiesPanelData = {
  status: OntologyListStatus;
  /** The user's ontologies first, then the shared ones provided by Pundit. */
  items: OntologiesPanelItem[];
  /** Whether the user imported an ontology (with elements). */
  hasOwn: boolean;
  /** Page where the user imports ontologies; no import section without it. */
  ontologiesLink?: string;
  labels: {
    title: string;
    description: string;
    /** Import section: title, button to the import page, description. */
    importSection: string;
    importButton: string;
    importDescription: string;
    listSection: string;
    /** The user imported no ontology (with elements). */
    ownEmpty: string;
    /** Badge of a shared ontology, and its tooltip. */
    sharedBadge: string;
    sharedTitle: string;
    error: string;
    saving: string;
    typeNames: Record<OntologyElementCategory, string>;
  };
};

@Component({
  selector: 'ontologies-panel',
  templateUrl: './ontologies-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, SvgIconComponent]
})
export class OntologiesPanelComponent {
  @Input() public data!: OntologiesPanelData | null;

  @Input() public emit!: (type: string, payload?: unknown) => void;

  onToggle(item: OntologiesPanelItem) {
    if (!this.emit || item.isSaving) return;
    this.emit('toggle', item.id);
  }

  onToggleCategory(item: OntologiesPanelItem, type: OntologiesPanelType) {
    if (!this.emit || item.isSaving || type.disabled) return;
    this.emit('togglecategory', { id: item.id, category: type.type });
  }
}
