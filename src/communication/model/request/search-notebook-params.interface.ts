export type NotebookFacetType = 'sharingMode';
export interface SearchNotebookParams {
    fulltext?: string,
    sharingMode?: 'public'|'private'| 'shared',
    facets?: NotebookFacetType[],
    /** Page to load, counting from 1. */
    page?: number,
    size?: number
}
