export interface FacetItem {
    key: string,
    count: number,
}
export interface Facet {
    name: string,
    results: FacetItem[]
}
