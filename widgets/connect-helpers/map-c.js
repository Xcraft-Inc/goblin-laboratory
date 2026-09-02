import C, {ConnectedProp} from './c.js';

function mergeInFuncs(inFunc1, inFunc2) {
  if (inFunc1) {
    if (inFunc2) {
      return (...args) => inFunc2(inFunc1(...args));
    }
    return inFunc1;
  }
  return inFunc2;
}

function mergeOutFuncs(outFunc1, outFunc2, inFunc1) {
  if (outFunc1) {
    if (outFunc2) {
      if (outFunc1.length > 1 || outFunc2.length > 1) {
        if (inFunc1) {
          return (newValue, oldValue, ...oldValues) =>
            outFunc1(
              outFunc2(newValue, inFunc1(oldValue, ...oldValues)),
              oldValue,
              ...oldValues
            );
        }
        return (newValue, oldValue, ...oldValues) =>
          outFunc1(
            outFunc2(newValue, oldValue, ...oldValues),
            oldValue,
            ...oldValues
          );
      }
      return (newValue) => outFunc1(outFunc2(newValue));
    }
    return outFunc1;
  }
  if (outFunc2 && outFunc2.length > 1 && inFunc1) {
    return (newValue, oldValue, ...oldValues) =>
      outFunc2(newValue, inFunc1(oldValue, ...oldValues));
  }
  return outFunc2;
}

export default function mapC(value, inFunc, outFunc) {
  if (value instanceof ConnectedProp) {
    return C(
      value.path,
      mergeInFuncs(value.inFunc, inFunc),
      mergeOutFuncs(value.outFunc, outFunc, value.inFunc)
    );
  }
  return inFunc(value);
}
