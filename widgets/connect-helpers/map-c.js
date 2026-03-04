import C, {ConnectedProp} from './c.js';

export default function mapC(value, inFunc, outFunc) {
  if (value instanceof ConnectedProp) {
    return C(
      value.path,
      value.inFunc ? (...args) => inFunc(value.inFunc(...args)) : inFunc,
      value.outFunc ? (...args) => value.outFunc(outFunc(...args)) : outFunc
    );
  }
  return inFunc(value);
}
