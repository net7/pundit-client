export function getDocumentFavicon(document = window.document): string {
  let href: string = null;
  ['icon', 'shortcut icon'].forEach((relAttr) => {
    if (!href) {
      const link = document.querySelector(`link[rel="${relAttr}"]`);
      if (link) {
        href = link.getAttribute('href') || null;
      }
    }
  });

  return href;
}
