export function getDocumentCanonicalUrl(document = window.document): string | null {
  const link = document.querySelector('link[rel="canonical"]');
  let href: string | null = null;
  if (link) {
    href = link.getAttribute('href') || null;
  }
  return href;
}
