const REPLY_TEXTAREA_SELECTOR = 'textarea.pnd-annotation__reply-textarea';

/**
 * Finds the reply textarea whose `id` attribute is `id`, inside `root`.
 * Backend ids may start with a digit (ULIDs), which makes `#<id>` an invalid
 * CSS selector: the match is made on the attribute value instead.
 */
export const findReplyTextarea = (
  root: ParentNode | null | undefined,
  id: string
): HTMLTextAreaElement | null => {
  if (!root) {
    return null;
  }
  const textareas = Array.from(root.querySelectorAll<HTMLTextAreaElement>(REPLY_TEXTAREA_SELECTOR));
  return textareas.find((el) => el.id === id) || null;
};

/** Reply textarea `id` inside the application's shadow root. */
export const getReplyTextarea = (id: string): HTMLTextAreaElement | null => {
  const root = document.getElementsByTagName('pnd-root')[0];
  return findReplyTextarea(root?.shadowRoot, id);
};
