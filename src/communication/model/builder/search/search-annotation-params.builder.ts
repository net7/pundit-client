import { WebPageMetadata } from '../..';
import { AnnotationFacetType, SearchAnnotationParams } from '../../request';

export class SearchAnnotationParamsBuilder {
    private _uri!: string;

    private _notebookId!: string;

    private _type!: 'Commenting' | 'Linking' | 'Highlighting';

    private _predicate!: string;

    private _dateFrom!: string;

    private _dateTo!: string;

    private _fulltext!: string;

    private _facets!: AnnotationFacetType[];

    private _size!: number;

    private _from!: number;

    private _userNotebooksOnly!: boolean;

    private _pageMetadata!: WebPageMetadata[];

    private _tags!: string | string[];

    uri = (value: string): SearchAnnotationParamsBuilder => {
      this._uri = value;
      return this;
    }

    pageMetadata = (value: WebPageMetadata[]): SearchAnnotationParamsBuilder => {
      this._pageMetadata = value;
      return this;
    }

    notebookId = (value: string): SearchAnnotationParamsBuilder => {
      this._notebookId = value;
      return this;
    }

    type = (value: 'Commenting' | 'Linking' | 'Highlighting'): SearchAnnotationParamsBuilder => {
      this._type = value;
      return this;
    }

    predicate = (value: string): SearchAnnotationParamsBuilder => {
      this._predicate = value;
      return this;
    }

    dateFrom = (value: string): SearchAnnotationParamsBuilder => {
      this._dateFrom = value;
      return this;
    }

    dateTo = (value: string): SearchAnnotationParamsBuilder => {
      this._dateTo = value;
      return this;
    }

    fulltext = (value: string): SearchAnnotationParamsBuilder => {
      this._fulltext = value;
      return this;
    }

    facets = (value: AnnotationFacetType[]): SearchAnnotationParamsBuilder => {
      this._facets = value;
      return this;
    }

    size = (value: number): SearchAnnotationParamsBuilder => {
      this._size = value;
      return this;
    }

    from = (value: number): SearchAnnotationParamsBuilder => {
      this._from = value;
      return this;
    }

    userNotebookOnly = (value: boolean): SearchAnnotationParamsBuilder => {
      this._userNotebooksOnly = value;
      return this;
    }

    tags = (value: string | string[]): SearchAnnotationParamsBuilder => {
      this._tags = value;
      return this;
    }

    build = (): SearchAnnotationParams => ({
      uri: this._uri,
      pageMetadata: this._pageMetadata,
      notebookId: this._notebookId,
      type: this._type,
      predicate: this._predicate,
      dateFrom: this._dateFrom,
      dateTo: this._dateTo,
      fulltext: this._fulltext,
      facets: this._facets,
      size: this._size,
      from: this._from,
      userNotebooksOnly: this._userNotebooksOnly,
      tags: this._tags
    })
}
