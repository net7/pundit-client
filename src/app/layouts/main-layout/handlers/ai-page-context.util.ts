import { AiAnnotateContext } from "src/communication";

/** Characters of page text sent on each side of the selection, at most. */
export const PAGE_CONTEXT_TEXT_LIMIT = 1500;

/** Characters of the beginning of the page text sent in a request on the page, at most. */
export const PAGE_TEXT_LIMIT = 6000;

/** Text that is not readable page text: code, styles, templates, Pundit's interface. */
const SKIPPED_ANCESTORS = "script, style, noscript, template, pnd-root";

type PageText = Pick<AiAnnotateContext, "before" | "after">;
type PageMetadata = Pick<AiAnnotateContext, "title" | "site" | "description">;

const collapse = (text?: string | null): string =>
  (text ?? "").replace(/\s+/g, " ").trim();

const metaContent = (doc: Document, selector: string): string =>
  collapse(doc.querySelector(selector)?.getAttribute("content"));

/** Only the fields with text. */
const withoutEmpty = <T extends Record<string, string | undefined>>(fields: T): Partial<T> =>
  Object.fromEntries(Object.entries(fields).filter(([, value]) => !!value)) as Partial<T>;

/**
 * Title, site and description of the page, each from its first non-blank
 * source: `og:title` or `document.title`; `og:site_name` or the host name;
 * `<meta name="description">` or `og:description`. Blank fields left out.
 */
export function getPageMetadata(doc: Document = document): PageMetadata {
  return withoutEmpty({
    title: metaContent(doc, 'meta[property="og:title"]') || collapse(doc.title),
    site:
      metaContent(doc, 'meta[property="og:site_name"]') ||
      collapse(doc.location?.hostname),
    description:
      metaContent(doc, 'meta[name="description"]') ||
      metaContent(doc, 'meta[property="og:description"]'),
  });
}

/**
 * Joins two pieces of page text as they are: no space is added, so words
 * split by inline formatting or highlights stay whole ("Bol" + "sena");
 * a double space at the junction is reduced to one.
 */
function glue(left: string, right: string): string {
  if (left.endsWith(" ") && right.startsWith(" ")) {
    return left + right.slice(1);
  }
  return left + right;
}

/** Page text nodes, skipping those that are not readable text. */
function createTextWalker(root: Node): TreeWalker {
  const doc = root.ownerDocument ?? (root as Document);
  return doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest(SKIPPED_ANCESTORS)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
}

/**
 * Text of the nodes next to `from` in one direction (whitespace collapsed,
 * joined as they are), until it is longer than the limit: one character
 * more tells whether the cut falls inside a word. Without `from`, forward
 * from the first text node of `root`.
 */
function collectText(
  root: Node,
  from: Text | null,
  backwards: boolean,
  limit: number = PAGE_CONTEXT_TEXT_LIMIT,
): string {
  const walker = createTextWalker(root);
  if (from) {
    walker.currentNode = from;
  }
  let text = "";
  while (text.length <= limit) {
    const node = backwards ? walker.previousNode() : walker.nextNode();
    if (!node) {
      break;
    }
    const piece = (node.textContent ?? "").replace(/\s+/g, " ");
    text = backwards ? glue(piece, text) : glue(text, piece);
  }
  return text;
}

/** The last `limit` characters, moved forward to a word start if the cut splits a word. */
function keepEnd(text: string, limit: number): string {
  if (text.length <= limit) {
    return text.trimStart();
  }
  let kept = text.slice(text.length - limit);
  const splitsWord = !/\s/.test(text[text.length - limit - 1]) && !/^\s/.test(kept);
  if (splitsWord) {
    const space = kept.search(/\s/);
    kept = space === -1 ? kept : kept.slice(space + 1);
  }
  return kept.trimStart();
}

/** The first `limit` characters, moved back to a word end if the cut splits a word. */
function keepStart(text: string, limit: number): string {
  if (text.length <= limit) {
    return text.trimEnd();
  }
  let kept = text.slice(0, limit);
  const splitsWord = !/\s/.test(text[limit]) && !/\s$/.test(kept);
  if (splitsWord) {
    const space = kept.search(/\s\S*$/);
    kept = space === -1 ? kept : kept.slice(0, space);
  }
  return kept.trimEnd();
}

/**
 * Page text right before `first` and right after `last`, the first and last
 * text nodes of the selection (already split at its boundaries, as for the
 * segments): up to 1,500 characters per side, in document order, without
 * looking at the page structure. Script, style, noscript, template and
 * Pundit's interface are skipped; highlights are page text. Empty sides are
 * left out (selection at the start or end, page without DOM text).
 */
export function getTextAround(
  first: Text,
  last: Text,
  root: Node = document.body,
): PageText {
  const before = keepEnd(collectText(root, first, true), PAGE_CONTEXT_TEXT_LIMIT);
  const after = keepStart(collectText(root, last, false), PAGE_CONTEXT_TEXT_LIMIT);
  return withoutEmpty({
    before: before.trim() ? before : undefined,
    after: after.trim() ? after : undefined,
  });
}

/**
 * Beginning of the page's readable text: from the first text node forward,
 * up to 6,000 characters, in document order, without looking at the page
 * structure. Same nodes as the text around a selection (script, style,
 * noscript, template and Pundit's interface skipped; highlights are page
 * text), whitespace runs collapsed, nodes joined as they are; a cut inside a
 * word moves back to the nearest space, or cuts at the character when there
 * is none. Trimmed; empty when the page has no DOM text.
 */
export function getPageText(root: Node = document.body): string {
  if (!root) {
    return "";
  }
  return keepStart(collectText(root, null, false, PAGE_TEXT_LIMIT), PAGE_TEXT_LIMIT).trim();
}

/**
 * Context of the page for an AI request on a selection: metadata, plus the
 * text around the selection when its boundary nodes are given. Undefined when
 * empty.
 */
export function buildPageContext(
  first?: Text,
  last?: Text,
): AiAnnotateContext | undefined {
  const context: AiAnnotateContext = {
    ...getPageMetadata(),
    ...(first && last ? getTextAround(first, last) : {}),
  };
  return Object.keys(context).length ? context : undefined;
}

/**
 * Context of the page for an AI request on the whole page: metadata and the
 * beginning of the page text, empty fields left out. Undefined when title,
 * description and text are all empty: there is nothing to annotate.
 */
export function buildWholePageContext(
  root: Node = document.body,
): AiAnnotateContext | undefined {
  const context: AiAnnotateContext = {
    ...getPageMetadata(),
    ...withoutEmpty({ text: getPageText(root) }),
  };
  return context.title || context.description || context.text ? context : undefined;
}
