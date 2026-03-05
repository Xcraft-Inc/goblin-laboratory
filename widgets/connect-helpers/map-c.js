import C, {ConnectedProp} from './c.js';

export default function mapC(value, inFunc, outFunc) {
  if (value instanceof ConnectedProp) {
    return C(
      value.path,
      value.inFunc ? (...args) => inFunc(value.inFunc(...args)) : inFunc,
      value.outFunc
        ? value.outFunc.length > 1 || outFunc.length > 1
          ? (newValue, ...oldValues) =>
              value.outFunc(outFunc(newValue, ...oldValues), ...oldValues)
          : (newValue) => value.outFunc(outFunc(newValue))
        : outFunc
    );
  }
  return inFunc(value);
}
