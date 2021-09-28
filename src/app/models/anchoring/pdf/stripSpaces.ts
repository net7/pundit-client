/**
 * Return a string with spaces stripped and offsets into the input string.
 *
 * This function optimizes for performance of stripping the main space chars
 * that PDF.js generates over handling all kinds of whitespace that could
 * occur in a string.
 *
 * @param {string} str
 * @return {[string, number[]]}
 */
export function stripSpaces(str: string): [string, number[]] {
  const offsets = [];
  let stripped = '';

  for (let i = 0; i < str.length; i += 1) {
    const char = str[i];
    if (char === ' ' || char === '\t' || char === '\n') {
      // eslint-disable-next-line no-continue
      continue;
    }
    stripped += char;
    offsets.push(i);
  }

  return [stripped, offsets];
}
