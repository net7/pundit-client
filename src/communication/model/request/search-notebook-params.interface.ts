export type NotebookFacetType = 'sharingMode';
export interface SearchNotebookParams {
    fulltext?: string,
    sharingMode?: 'public'|'private'| 'shared',
    facets?: NotebookFacetType[],
    size?: number,
    from?: number
}
