export const createMask = (phoneMask, updateState, sendNotify, customSubscribe) => {
  const telephoneMask = phoneMask || '+X(XXX)-XXX-XX-XX';
  const maskObj = telephoneMask.split('').reduce((acc, it, index) => {
    acc[++index] = it === 'X' ? -2 : -1;
    return acc;
  }, {});
  const defaultValue = telephoneMask.replace(/X/g, '_');
  const MIN_CURSOR_POS = telephoneMask.indexOf('X');
  const MAX_CURSOR_POS = telephoneMask.lastIndexOf('X') + 1;
  let stateVal = defaultValue;

  class SlipperMask {
    constructor(update, sendNote, customSub) {
      this.position = MIN_CURSOR_POS;
      this.customUpdate = update;
      this.sendNotify = sendNote;
      this.customSubscribe = customSub;

      this.posStart = 0;
      this.posEnd = 0;
    }

    getPhoneNum = () => stateVal;

    resetMask = maskObjArr => {
      maskObjArr.forEach((it, i) => {
        if (~maskObj[++i]) {
          maskObj[i] = -2;
        }
      });
      this.position = MIN_CURSOR_POS;
      return null;
    };

    updateState = (e) => {
      stateVal = Object.values(maskObj).reduce((acc, it, index) => {
        if (it === -1) return acc + telephoneMask[index];
        if (it === -2) return `${acc}_`;
        return acc + maskObj[index + 1];
      }, '');
      if (this.customUpdate) {
        this.customUpdate(stateVal, this.position);
      } else {
        e.target.value = this.getPhoneNum();
        e.target.setSelectionRange(this.position, this.position);
      }
    };

    updateValue = e => {
      const { value } = e.target;
      const invalidData = value.match(/[^\d]/g);
      if (invalidData && typeof this.sendNotify === 'function') {
        this.sendNotify(invalidData);
      }
      const arrDigit = (value.match(/\d/g)) || [];
      const prevArrDigit = (stateVal.match(/\d/g)) || [];

      const arrLen = arrDigit.length;
      const prevLen = prevArrDigit.length;

      const direction = arrLen > prevLen ? 'left' : 'right';
      const diff = Math.abs(prevLen - arrLen);

      const maskObjArr = Object.values(maskObj);

      if (diff > 1 && arrLen > 0) {
        if (direction === 'left') {
          const index = arrDigit.findIndex((it, i) => it !== prevArrDigit[i] || i === prevLen && 0);
          arrDigit.some((it, i) => {
            if (i >= diff) return true;
            prevArrDigit[index + i] = arrDigit[index + i];
            this.updateMaskObj(direction, 1, prevArrDigit);
            return false;
          });
        } else {
          if (this.position === MAX_CURSOR_POS) {
            this.position = MIN_CURSOR_POS;
          }
          maskObjArr.reduce((acc, it, i) => {
            if (maskObj[++i] !== -1 && i > this.position && maskObj[i] !== -2 && acc < diff) {
              maskObj[i] = -2;
              return acc + 1;
            }
            return acc;
          }, 0);
        }
      } else if (!arrLen) {
        this.resetMask(maskObjArr);
      } else {
        this.updateMaskObj(direction, diff, arrDigit, prevLen, maskObjArr);
      }
      this.updateState(e);
    };

    updateMaskObj = (direction, diff, arrDigit, prevLen, maskObjArr) => {
      if (diff === 1 && direction === 'right' && diff === prevLen) {
        return this.resetMask(maskObjArr);
      }

      if (diff === 1 && direction === 'right' && this.posEnd - this.posStart > 1) {
        // correct a position if removed one symbol by multiple selection
        let index = this.posStart;
        while (index <= this.posEnd + 1) {
          if (maskObjArr[index] !== -2 && maskObjArr[index] !== -1) {
            this.position = index + 1;
            break;
          }
          index += 1;
        }
      }

      let currentPos = this.position;
      if (currentPos < MIN_CURSOR_POS) {
        currentPos = MIN_CURSOR_POS;
      } else if (currentPos > MAX_CURSOR_POS) {
        currentPos = MAX_CURSOR_POS;
      }
      if (direction === 'left') {
        let temp = 0;
        if (diff === 1) {
          const arr = Object.values(maskObj);
          arr.push('-1');
          arr.some((it, index) => {
            if (!~maskObj[index] || !index) return false;
            if (index <= currentPos) {
              if (maskObj[index] !== -2) temp++;
              return false;
            }
            maskObj[index] = +arrDigit[temp];
            return true;
          });
          arr.some((it, index) => {
            if (!~maskObj[index] || !index) return false;
            if (temp >= 0) {
              // требуется для перевода последнего символа
              if (temp === 0) this.position = MAX_CURSOR_POS;
              if (maskObj[index] !== -2) temp--;
              return false;
            }
            this.position = index - 1;
            return true;
          });
        }
        return null;
      }
      if (diff === 0) {
        for (let i = this.position; i >= MIN_CURSOR_POS; i--) {
          this.position = i;
          if (!~maskObj[i] || maskObj[i] === -2) {
            continue;
          }
          break;
        }
      } else if (diff === 1) {
        for (let i = this.position; i >= MIN_CURSOR_POS; i--) {
          if (!~maskObj[i] || maskObj[i] === -2) {
            continue;
          }
          maskObj[i] = -2;
          break;
        }
        this.position--;
        while (!~maskObj[this.position] === -1) {
          this.position--;
          if (this.position < MIN_CURSOR_POS) {
            this.position = MIN_CURSOR_POS;
            break;
          }
        }
      }
    };

    definePosition = e => {
      const { value, selectionStart: posStart, selectionEnd: posEnd } = e.target;

      const arrLen = ((value.match(/\d/g)) || []).length;
      const prevLen = ((stateVal.match(/\d/g)) || []).length;
      const diff = Math.abs(arrLen - prevLen);

      this.posStart = posStart < MIN_CURSOR_POS ? MIN_CURSOR_POS : posStart;
      this.posEnd = posEnd;

      if (diff === 1 || posEnd - posStart === 1) {
        this.position = posEnd;
      } else {
        this.position = posStart;
      }
    };
  }

  return new SlipperMask(updateState, sendNotify, customSubscribe);
};


export const subscribe = (element, phoneMask) => {
  const slipper = createMask(phoneMask);
  slipper.value = slipper.getPhoneNum();
  const formatValue = (e) => {
    e.stopPropagation();
    slipper.updateValue(e);
  };

  const definePosition = (e) => {
    e.stopPropagation();
    slipper.definePosition(e);
  };

  element.addEventListener('input', formatValue);
  element.addEventListener('click', definePosition);
  element.addEventListener('keyup', definePosition);
  return () => {
    element.removeEventListener('input', formatValue);
    element.removeEventListener('click', definePosition);
    element.removeEventListener('keyup', definePosition);
  };
};
