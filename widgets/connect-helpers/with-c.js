import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import {ConnectedProp, ConnectedPropData} from './c.js';
import Shredder from 'xcraft-core-shredder';

function isShredderOrImmutable(obj) {
  return obj && (Shredder.isShredder(obj) || Shredder.isImmutable(obj));
}

/**
 * Wrap a component that does not support connected props to support them.
 *
 * @param {Component} Component - Any React component.
 * @param {Object} dispatchProps -
 * @return {Widget} A widget supporting connected props.
 */
export default function withC(Component, dispatchProps = {}) {
  const Mapper = props => {
    let {_connectedProps, _connectedProp, ...otherProps} = props;
    const newProps = {};
    for (const prop of _connectedProps) {
      const inFunc = prop.inFunc;
      if (inFunc) {
        const name = prop.name;
        if (name === '_connectedProp') {
          _connectedProp = inFunc(_connectedProp);
        } else {
          newProps[name] = inFunc(props[name]);
        }
      }
    }
    if (isShredderOrImmutable(_connectedProp)) {
      _connectedProp = _connectedProp.toObject();
    }
    return <Component {...otherProps} {..._connectedProp} {...newProps} />;
  };

  const ConnectedComponent = Widget.connect(
    (state, props) => {
      const newProps = {};
      for (const prop of props._connectedProps) {
        const fullPath = prop.fullPath;
        let value;
        if (fullPath !== null && fullPath !== undefined) {
          value = state.get(fullPath);
        }
        newProps[prop.name] = value;
      }
      return newProps;
    },
    () => ({}) // Do not add "dispatch" to the props
  )(Mapper);

  class WithC extends Widget {
    constructor() {
      super(...arguments);

      const connectedPropNames = [];
      for (const [name, value] of Object.entries(this.props)) {
        if (value instanceof ConnectedProp) {
          connectedPropNames.push(name);
        }
      }
      if (this.props._connectedProp instanceof ConnectedPropData) {
        connectedPropNames.push('_connectedProp');
      }
      if (connectedPropNames.length > 0) {
        this.connectedPropNames = connectedPropNames;
        this.render = this.renderConnected;
      } else {
        this.render = this.renderNotConnected;
      }
    }

    addContextToPath(path) {
      if (path && path.startsWith('.')) {
        const model = this.props.model || this.context.model;
        if (path === '.') {
          return model;
        }
        if (!model) {
          return path.substring(1); // Remove '.'
        }
        return `${model}${path}`;
      }
      return path;
    }

    handlePropChange(propName, value) {
      const path = this.addContextToPath(this.props[propName].path);
      if (!path) {
        throw new Error(`Path is not defined`);
      }
      // Dispatch backend quest or frontend action
      const [root, id, ...pathArray] = path.split('.');
      const valuePath = pathArray.join('.');
      if (root === 'backend') {
        // If the 'change' quest is called here, it doesn't compensate and
        // the value displayed in an input flickers.
        // this.doFor(id, 'change', {
        //   path,
        //   newValue: value,
        // });

        // TODO: rename this action
        this.rawDispatch({
          type: 'FIELD-CHANGED',
          path,
          value,
        });
      } else if (root === 'widgets') {
        this.dispatchTo(id, {
          type: 'CHANGE',
          path: valuePath,
          newValue: value,
        });
      } else {
        throw new Error(`Model path starting with '${root}' is not supported.`);
      }
    }

    renderConnected() {
      const onChangeProps = {};
      const connectedProps = this.connectedPropNames.map(name => {
        const prop = this.props[name];
        //TODO handle array of path (for extra arguments to inFunc)
        prop.name = name;
        prop.fullPath = this.addContextToPath(prop.path);

        if (name in dispatchProps) {
          const dispatchPropName = dispatchProps[name];
          const outFunc = prop.outFunc;
          if (outFunc) {
            onChangeProps[dispatchPropName] = value =>
              this.handlePropChange(name, outFunc(value));
          } else {
            onChangeProps[dispatchPropName] = value =>
              this.handlePropChange(name, value);
          }
        }

        return prop;
      });
      return (
        <ConnectedComponent
          {...onChangeProps}
          {...this.props}
          _connectedProps={connectedProps}
        />
      );
    }

    renderNotConnected() {
      return <Component {...this.props} />;
    }

    // "render" function is selected in constructor
  }

  return WithC;
}
