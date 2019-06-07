import Shredder from 'xcraft-core-shredder';

export default function C(path, inFunc, outFunc) {
  return new Shredder({
    _type: 'connectedProp',
    path,
    inFunc,
    outFunc,
  });
}
