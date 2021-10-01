/**
 * Return the last component of the path part of a URL.
 *
 * @param {string} url - A valid URL string
 * @return {string}
 */
export function filenameFromURL(url: string): string {
  const parsed = new URL(url);
  const pathSegments = parsed.pathname.split('/');
  return pathSegments[pathSegments.length - 1];
}
