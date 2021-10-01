/**
 * Generate a URI from a PDF fingerprint suitable for storing as the main
 * or associated URI of an annotation.
 *
 * @param {string} fingerprint
 */
export function fingerprintToURN(fingerprint: string): string {
  return `urn:x-pdf:${fingerprint}`;
}
