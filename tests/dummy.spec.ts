import { expect, assert } from 'chai';
import 'mocha';

describe('Dummy test', () => {
  it('should return true', () => {
    expect(true).to.be.true;
  });
  it('should be zero', () => {
    const zero = 0;
    assert.equal(zero, 0);
  });
});
