// Get the true URI record when it's masked via a different protocol.
// This happens when an href is set with a uri using the 'blob:' protocol
// but the document can set a different uri through a <base> tag.
export function getDocumentHref(document = window.document): string {
  const { href } = document.location;
  const { baseURI } = document;
  const allowedSchemes = ['http:', 'https:', 'file:'];

  // Use the current document location if it has a recognized scheme.
  const scheme = new URL(href).protocol;
  if (allowedSchemes.includes(scheme)) {
    return href;
  }

  // Otherwise, try using the location specified by the <base> element.
  if (baseURI && allowedSchemes.includes(new URL(baseURI).protocol)) {
    return baseURI;
  }

  // Fall back to returning the document URI, even though the scheme is not
  // in the allowed list.
  return href;
}
