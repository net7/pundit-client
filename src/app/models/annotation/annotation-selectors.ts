import { SelectorWithType } from '@net7/annotator';

/** Stored selectors of an annotation target (subject.selected). */
export type SelectedTarget = {
  rangeSelector?: object;
  textPositionSelector?: object;
  textQuoteSelector?: object;
} | null | undefined;

/**
 * The selectors to anchor an annotation target with `@net7/annotator`'s anchor(),
 * in its priority order: range, text position, text quote.
 */
export const getAnnotationSelectors = (selected: SelectedTarget): SelectorWithType[] => {
  if (!selected) {
    return [{ start: 0, end: 0, type: 'TextPositionSelector' } as SelectorWithType];
  }
  const selectors: SelectorWithType[] = [];
  if (selected.rangeSelector) {
    selectors.push({ type: 'RangeSelector', ...selected.rangeSelector } as SelectorWithType);
  }
  if (selected.textPositionSelector) {
    selectors.push({ type: 'TextPositionSelector', ...selected.textPositionSelector } as SelectorWithType);
  }
  if (selected.textQuoteSelector) {
    selectors.push({ type: 'TextQuoteSelector', ...selected.textQuoteSelector } as SelectorWithType);
  }
  return selectors;
};
