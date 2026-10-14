import { WebPageMetadata } from '../entity';

export type AnnotationFacetType = 'uri' | 'notebookId' | 'type' | 'tag' | 'predicate';
export interface SearchAnnotationParams {
    uri?: string,
    pageMetadata?: WebPageMetadata[],
    notebookId?: string,
    type?: 'Commenting' | 'Linking' | 'Highlighting',
    predicate?: string, // match
    dateFrom?: string,
    dateTo?: string,
    fulltext?: string,
    facets?: AnnotationFacetType[],
    size?: number;
    from?: number;
    tags?: string | string[]
    userNotebooksOnly?: boolean;
}
