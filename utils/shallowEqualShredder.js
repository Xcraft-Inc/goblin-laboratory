// See 'react-redux/src/utils/shallowEqual.js'

function isShredder(obj) {
  return typeof obj === 'object' && obj !== null && obj._isSuperReaper6000;
}

function unwrapShredder(obj) {
  if (isShredder(obj)) {
    return obj.state;
  }
  return obj;
}

const hasOwn = Object.prototype.hasOwnProperty;

function is(x, y) {
  x = unwrapShredder(x);
  y = unwrapShredder(y);
  return Object.is(x, y);
}

export default function shallowEqualShredder(objA, objB) {
  if (is(objA, objB)) return true;

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}
