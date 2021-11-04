export function getDocumentCanonicalUrl(document = window.document): string {
  const link = document.querySelector('link[rel="canonical"]');
  let href: string = null;
  if (link) {
    href = link.getAttribute('href') || null;
  }
  return href;
}
