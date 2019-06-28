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
 * For example with a simple text field:
 * ```javascript
 * <TextFieldNC
 *   value="42"
 *   onChange={this.handleChange}
 * />
 * ```
 * It can be wrapped with:
 * ```javascript
 * const TextField = withC(TextFieldNC, {value: 'onChange'})
 * ```
 * And then the prop "value" can be connected to the state using:
 * ```javascript
 * <TextFieldNC
 *   value={C('.age')}
 * />
 * ```
 * Two functions can be applied, when reading and writing to the state:
 * ```javascript
 * <TextFieldNC
 *   value={C('.age', age => age + '', age => Number(age))}
 * />
 * ```
 *
 * The spread syntax can be used to connect multiple props at once:
 * ```javascript
 * function mapAge(age){
 *   return {
 *     text: age + '',
 *     backgroundColor: age >= 18 ? 'green' : 'red',
 *   }
 * }
 * <Label
 *   {...C('.age', mapName}
 * />
 * ```
 *
 * Note: a prop must be always or never connected.
 * It is not possible to change between connected and not connected for optimization.
 * Thus, if a wrapped component does not receive any connected prop, most of the logic for connected
 * props is skipped.
 * ```javascript
 * // This is ok. When the path is "null" or "undefined", the prop "text" will receive "undefined"
 * const path = id ? `backend.${id}.value` : null;
 * <Label
 *   text={C(path)}
 * />
 * // But this is not ok. "value" is sometimes "C(...)" or "null", which is not a "C(...)"
 * const value = id ? C(`backend.${id}.value`) : null;
 * <Label
 *   text={value}
 * />
 * ```
 *
 * @param {Component} Component - Any React component.
 * @param {Object} dispatchProps - (optional) Mapping between value props and dispatch props.
 * @return {Widget} A widget supporting connected props.
 */
export default function withC(Component, dispatchProps = {}) {
  // Component used after connect
  // It applies "inFunc" to the connected props and
  // prevents giving internal props (starting with "_") to the underlying component
  const ConnectedPropsMapper = props => {
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
    // Do not spread an immutable to the props but spread it's content
    if (isShredderOrImmutable(_connectedProp)) {
      _connectedProp = _connectedProp.toObject();
    }
    return <Component {...otherProps} {..._connectedProp} {...newProps} />;
  };

  // Map state to props
  // Replace connected props by their corresponding value in the state
  const ConnectedComponent = Widget.connect(
    (state, props) => {
      const newProps = {};
      for (const prop of props._connectedProps) {
        const fullPath = prop.fullPath;
        let value;
        // Do not get state if the path is not defined
        // TODO: this logic could be moved to render
        if (fullPath !== null && fullPath !== undefined) {
          value = state.get(fullPath);
        }
        newProps[prop.name] = value;
      }
      return newProps;
    },
    () => ({}) // Do not add "dispatch" to the props
  )(ConnectedPropsMapper);

  // Component used before connect
  // It determines if there are connected props, handles actions
  // to change the value of the props and transforms relative to absolute paths
  class WithC extends Widget {
    constructor() {
      super(...arguments);

      // Find connected props
      const connectedPropNames = [];
      for (const [name, value] of Object.entries(this.props)) {
        if (value instanceof ConnectedProp) {
          connectedPropNames.push(name);
        }
      }
      // Find special prop made by ...C() syntax
      if (this.props._connectedProp instanceof ConnectedPropData) {
        connectedPropNames.push('_connectedProp');
      }

      // Optimize render if there is no connected prop
      if (connectedPropNames.length > 0) {
        this.connectedPropNames = connectedPropNames;
        this.render = this.renderConnected;
      } else {
        this.render = this.renderNotConnected;
      }
    }

    addContextToPath(path) {
      // Add context.model before path if it is relative
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

    // Render function used with connected props
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

    // Render function used when there is no connected prop
    renderNotConnected() {
      return <Component {...this.props} />;
    }

    // "render" function is selected in constructor
  }

  return WithC;
}
