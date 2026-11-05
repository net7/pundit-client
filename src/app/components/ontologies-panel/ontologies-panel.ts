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
  types: OntologiesPanelType[];
  selected: boolean;
  /** The change of this ontology is being saved: its controls wait. */
  isSaving: boolean;
};

export type OntologiesPanelData = {
  status: OntologyListStatus;
  items: OntologiesPanelItem[];
  ontologiesLink?: string;
  labels: {
    title: string;
    description: string;
    empty: string;
    emptyLink: string;
    error: string;
    saving: string;
    typeNames: Record<OntologyElementCategory, string>;
  };
};

@Component({
  selector: 'ontologies-panel',
  templateUrl: './ontologies-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgIconComponent]
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
