export function isCSSPropertySupported(property: string, value: string): boolean {
  if (typeof CSS !== 'function' || typeof (CSS as any).supports !== 'function') {
    /* istanbul ignore next */
    return false;
  }
  return (CSS as any).supports(property, value);
}
