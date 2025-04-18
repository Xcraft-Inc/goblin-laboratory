// See 'react-redux/src/utils/shallowEqual.js'

const hasOwn = Object.prototype.hasOwnProperty;

export function isEqual(x, y) {
  if (x && typeof x.equals === 'function') {
    return x.equals(y);
  }
  return Object.is(x, y);
}

export default function shallowEqualShredder(objA, objB) {
  if (isEqual(objA, objB)) return true;

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
    if (
      !hasOwn.call(objB, keysA[i]) ||
      !isEqual(objA[keysA[i]], objB[keysA[i]])
    ) {
      return false;
    }
  }

  return true;
}
