export function isValidAnnotationPayload(p: any): boolean {
  const selected = p?.subject?.selected;
  if (!selected) {
    console.warn(
      "[saveAnnotation] Payload saltato: subject.selected mancante",
      p,
    );
    return false;
  }
  if (
    !selected.rangeSelector?.startContainer ||
    !selected.rangeSelector?.endContainer
  ) {
    console.warn(
      "[saveAnnotation] Payload saltato: rangeSelector incompleto",
      selected,
    );
    return false;
  }
  if (!selected.textQuoteSelector?.exact) {
    console.warn(
      "[saveAnnotation] Payload saltato: textQuoteSelector.exact mancante",
      selected,
    );
    return false;
  }
  return true;
}
