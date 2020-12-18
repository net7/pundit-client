export function isCSSPropertySupported(property: string, value: string): boolean {
  if (typeof CSS !== 'function' || typeof CSS.supports !== 'function') {
    /* istanbul ignore next */
    return false;
  }
  return CSS.supports(property, value);
}
