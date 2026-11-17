import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { _t } from '@net7/core';
import { getOntologySourceLabel } from 'src/app/services/ontology.service';
import { SvgIconComponent } from '../../../../svg-icon/svg-icon';
import { SemanticSubjectGroup, getObjectType } from '../semantic-section.utils';

/** Events sent by the subject field to the semantic section. */
export type SemanticSubjectFieldEvent =
  'focus' | 'query' | 'keydown' | 'blur' | 'toggle'
  | 'pick' | 'pick-uri';

export type SemanticSubjectFieldLabels = {
  subjectPlaceholder: string;
  subjectHint: string;
  subjectNoResults: string;
  subjectNoOntologies: string;
  openUri: string;
  types: Record<string, string>;
};

/**
 * Subject of an subject block: an autocomplete over the classes and entities of the
 * selected ontologies, or a typed URI. The state lives in the semantic section.
 */
@Component({
  selector: 'pnd-semantic-subject-field',
  templateUrl: './subject-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgIconComponent]
})
export class SemanticSubjectFieldComponent {
  @Input() public group!: SemanticSubjectGroup;

  @Input() public labels!: SemanticSubjectFieldLabels;

  /** Some ontology is used for classes or entities. */
  @Input() public canSearch = false;

  @Input() public emit!: (type: SemanticSubjectFieldEvent, payload?: any) => void;

  public getSourceLabel = getOntologySourceLabel;

  /** Label shown in the field when it is closed. */
  get subjectLabel(): string {
    return this.group.subject.picked?.label || '';
  }

  /** Badge of the picked subject: its element type, or URI for a typed one. */
  get subjectType(): string | null {
    const { picked } = this.group.subject;
    if (!picked) return null;
    return picked.elementType || 'uri';
  }

  /** The typed text can be used as subject (it is a URI). */
  get typedUri(): string | null {
    const query = this.group.subject.query.trim();
    return getObjectType(query) === 'uri' ? query : null;
  }

  getUseAsLabel(value: string) {
    return _t('editmodal#semantic_default_option', { value });
  }

  getTypeLabel(type: string) {
    return this.labels.types[type] || type;
  }
}
