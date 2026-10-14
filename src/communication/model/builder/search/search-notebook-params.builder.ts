import { NotebookFacetType, SearchNotebookParams } from '../../request';

export class SearchNotebookParamsBuilder {
    private _fulltext?: string;

    private _sharingMode?: 'public' | 'private' | 'shared';

    private _facets?: NotebookFacetType[];

    private _size?: number;

    fulltext = (value: string): SearchNotebookParamsBuilder => {
      this._fulltext = value;
      return this;
    }

    sharingMode = (value: 'public' | 'private' | 'shared'): SearchNotebookParamsBuilder => {
      this._sharingMode = value;
      return this;
    }

    facets = (value: NotebookFacetType[]): SearchNotebookParamsBuilder => {
      this._facets = value;
      return this;
    }

    size = (value: number): SearchNotebookParamsBuilder => {
      this._size = value;
      return this;
    }

    build = (): SearchNotebookParams => ({
      fulltext: this._fulltext,
      sharingMode: this._sharingMode,
      facets: this._facets,
      size: this._size
    })
}
