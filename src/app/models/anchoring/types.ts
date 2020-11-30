export type TextQuoteSelectorWithType = {
  type: 'TextQuoteSelector';
  exact: string;
  prefix?: string;
  suffix?: string;
}

export type TextPositionSelectorWithType = {
  type: 'TextPositionSelector';
  start: number;
  end: number;
}

export type RangeSelector = {
  startContainer: string;
  startOffset: number;
  endContainer: string;
  endOffset: number;
}

export type RangeSelectorWithType = {
  type: 'RangeSelector';
  startContainer: string;
  startOffset: number;
  endContainer: string;
  endOffset: number;
}

export type SelectorWithType
  = RangeSelectorWithType
  | TextPositionSelectorWithType
  | TextQuoteSelectorWithType;

export type QuerySelectorOptions = {
  hint?: number;
};

export type Anchor = {
  toRange(options: QuerySelectorOptions): Range;
};

export type BrowserNormalizedRange = {
  start: Node | Text;
  startContainer: Node;
  startOffset: number;
  end: Node | Text;
  endContainer: Node;
  endOffset: number;
  commonAncestor?: Node;
};
