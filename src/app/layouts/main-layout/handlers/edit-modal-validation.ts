export function isValidAnnotationPayload(p: any): boolean {
  const selected = p?.subject?.selected;
  if (!selected) {
    return false;
  }
  if (
    !selected.rangeSelector?.startContainer ||
    !selected.rangeSelector?.endContainer
  ) {
    return false;
  }
  if (!selected.textQuoteSelector?.exact) {
    return false;
  }
  return true;
}
