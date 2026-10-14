import { HighlightAnnotation } from '../../entity';
import { AbstractAnnotationBuilder } from './abstract-annotation.builder';

export class HighlightAnnotationBuilder extends AbstractAnnotationBuilder {
  public build(): HighlightAnnotation {
    const baseAnnotation = super.build();
    return {
      ...baseAnnotation,
      type: 'Highlighting'
    };
  }
}
