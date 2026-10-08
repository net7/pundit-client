export interface RangeSelector {
    startContainer: string;
    startOffset: number;
    endContainer: string;
    endOffset: number;
}
export interface TextPositionSelector {
    start: number;
    end: number;
}
export interface TextQuoteSelector {
    exact: string;
    prefix?: string;
    suffix?: string;
}
export interface WebPageFragment {
    text: string
    rangeSelector: RangeSelector;
    textPositionSelector: TextPositionSelector;
    textQuoteSelector: TextQuoteSelector;
}
export interface WebPageMetadata {
    key: string,
    value: string
}
export interface WebPage {
    pageTitle: string;
    pageContext: string;
    selected?: WebPageFragment;
    pageFavicon?: string;
    pageMetadata?: WebPageMetadata[];
}
