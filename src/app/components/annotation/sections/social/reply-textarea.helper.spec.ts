import { findReplyTextarea } from './reply-textarea.helper';

describe('findReplyTextarea', () => {
  const ULID = '01HXYZ5D7Q8R9S0T1V2W3X4Y5Z';
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    root.innerHTML = `
      <textarea id="other" class="pnd-annotation__reply-textarea"></textarea>
      <textarea id="${ULID}" class="pnd-annotation__reply-textarea"></textarea>
      <textarea id="${ULID}-x" class="something-else"></textarea>
    `;
  });

  it('finds a textarea whose id starts with a digit', () => {
    // browsers throw on `textarea#<id>` for this id (jsdom is lenient about it)
    expect(findReplyTextarea(root, ULID)?.id).toBe(ULID);
  });

  it('only matches reply textareas', () => {
    expect(findReplyTextarea(root, `${ULID}-x`)).toBeNull();
  });

  it('returns null without a root or a match', () => {
    expect(findReplyTextarea(null, ULID)).toBeNull();
    expect(findReplyTextarea(root, 'missing')).toBeNull();
  });
});
