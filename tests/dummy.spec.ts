import { expect } from 'chai';
import 'mocha';
import dummy from '../dummy';

describe('Dummy test', () => {
  it('should return true', () => {
    expect(dummy()).to.be.true;
  });
});
