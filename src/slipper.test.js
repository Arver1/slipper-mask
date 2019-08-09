import { expect } from 'chai';
import { createMask } from './slipper';

describe('method createMask', () => {
  describe('call without params', () => {
    it('result must be an object', () => {
      expect(createMask()).to.be.a('object');
    });
    it('SlipperMask contract', () => {
      expect(createMask()).to.have.property('getPhoneNum');
      expect(createMask()).to.have.property('resetMask');
      expect(createMask()).to.have.property('updateState');
      expect(createMask()).to.have.property('updateValue');
      expect(createMask()).to.have.property('updateMaskObj');
      expect(createMask()).to.have.property('definePosition');
    });
  });
});
