import {
  RangeSelector, TextPositionSelector, TextQuoteSelector, WebPage, WebPageFragment, WebPageMetadata
} from '../../entity';

export class WebPageBuilder {
  private _pageTitle!: string;

  private _pageContext!: string;

  private _pageFavicon?: string;

  private _pageMetadata?: WebPageMetadata[];

  private _selected?: WebPageFragment;

  pageTitle = (title: string): WebPageBuilder => {
    this._pageTitle = title;
    return this;
  }

  pageContext = (uri: string): WebPageBuilder => {
    this._pageContext = uri;
    return this;
  }

  pageFavicon = (favicon: string): WebPageBuilder => {
    this._pageFavicon = favicon;
    return this;
  }

  pageMetadata = (metatada: WebPageMetadata[]): WebPageBuilder => {
    this._pageMetadata = metatada;
    return this;
  }

  selected = (text: string,
    rangeSelector: RangeSelector,
    textPositionSelector: TextPositionSelector,
    textQuoteSelector: TextQuoteSelector) => {
    this._selected = {
      text,
      rangeSelector,
      textPositionSelector,
      textQuoteSelector
    };
    return this;
  }

  build = (): WebPage => ({
    pageTitle: this._pageTitle,
    pageContext: this._pageContext,
    pageFavicon: this._pageFavicon,
    pageMetadata: this._pageMetadata,
    selected: this._selected
  })
}
