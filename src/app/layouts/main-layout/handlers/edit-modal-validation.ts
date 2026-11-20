/** A page annotation (no selection) has the content of its type. */
function hasPageContent(p: any): boolean {
  switch (p?.type) {
    case "Commenting":
      return !!p.content?.comment;
    case "Linking":
      return Array.isArray(p.content) && p.content.length > 0;
    default:
      return Array.isArray(p?.tags) && p.tags.length > 0;
  }
}

/**
 * A payload that can be saved: with a selection, one that can be anchored;
 * without (a page annotation), one with the content of its type (a comment,
 * tags or triples).
 */
export function isValidAnnotationPayload(p: any): boolean {
  if (!p?.subject) {
    return false;
  }
  const selected = p.subject.selected;
  if (!selected) {
    return hasPageContent(p);
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
