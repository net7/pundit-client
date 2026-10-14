import { Entity } from './entity';
import { Tag } from './tag';
import { Timestamp } from './timestamp';
import { SemanticTripleType } from './triple';
import { WebPage } from './web-page';

export type AnnotationType = 'Commenting' | 'Linking' | 'Highlighting';
export interface AnnotationBase {
    notebookId: string,
    userId: string,
    serializedBy: string,
    subject: WebPage,
    tags?: Tag[],
    color?: string
}
export interface HighlightAnnotation extends AnnotationBase {
    type: 'Highlighting';
}
export interface LinkAnnotation extends AnnotationBase {
    type: 'Linking',
    content: SemanticTripleType[],
}
export interface CommentAnnotation extends AnnotationBase {
    type: 'Commenting',
    content: {
        comment: string;
    }
}
export interface AnnotationUri {
    uri: string
}
export type AnnotationAttributes = (HighlightAnnotation | LinkAnnotation | CommentAnnotation)
export type Annotation = AnnotationAttributes & Entity & Timestamp & AnnotationUri
