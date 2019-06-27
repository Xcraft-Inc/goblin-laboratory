export class ConnectedPropData {
  constructor(path, inFunc, outFunc) {
    this.path = path;
    this.inFunc = inFunc;
    this.outFunc = outFunc;
  }

  // Comparison for shouldComponentUpdate
  equals(o) {
    if (!o) {
      return false;
    }
    if (!(o instanceof ConnectedPropData)) {
      return false;
    }

    if (
      o.path !== this.path ||
      o.inFunc !== this.inFunc ||
      o.outFunc !== this.outFunc
    ) {
      return false;
    }

    return true;
  }
}

// This class has only one enumerable property: _connectedProp.
// When using the spread syntax ...C(), it adds _connectedProp to the props.
export class ConnectedProp {
  constructor(path, inFunc, outFunc) {
    this._connectedProp = new ConnectedPropData(path, inFunc, outFunc);
  }

  get path() {
    return this._connectedProp.path;
  }

  set path(value) {
    this._connectedProp.path = value;
  }

  get inFunc() {
    return this._connectedProp.inFunc;
  }

  set inFunc(value) {
    this._connectedProp.inFunc = value;
  }

  get outFunc() {
    return this._connectedProp.outFunc;
  }

  set outFunc(value) {
    this._connectedProp.outFunc = value;
  }

  // Comparison for shouldComponentUpdate
  equals(o) {
    if (!o) {
      return false;
    }
    if (!(o instanceof ConnectedProp)) {
      return false;
    }

    if (!this._connectedProp.equals(o._connectedProp)) {
      return false;
    }

    return true;
  }
}

export default function C(path, inFunc, outFunc) {
  return new ConnectedProp(path, inFunc, outFunc);
}
