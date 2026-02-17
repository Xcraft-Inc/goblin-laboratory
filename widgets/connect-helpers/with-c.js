import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import {ConnectedProp, ConnectedPropData} from './c.js';
import Shredder from 'xcraft-core-shredder';
import arrayEquals from './arrayEquals.js';
import WithModel from '../with-model/widget.js';
import joinModels from './join-models.js';
import ModelContext from '../with-model/context.js';

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
 * It is possible to connect a prop to multiple values in the state:
 * ```javascript
 * <TextFieldNC
 *   value={C(['.age', '.limit'], (age, limit) => age > limit ? age : limit)}
 * />
 * ```
 *
 * Note: When the path is "null" or "undefined", the prop "text" will receive "undefined"
 * ```javascript
 * const path = id ? `backend.${id}.value` : null;
 * <Label
 *   text={C(path)}
 * />
 * ```
 *
 * @param {Component} Component - Any React component.
 * @param {Object} dispatchProps - (optional) Mapping between value props and dispatch props.
 * @param {Object} [options] - Options.
 * @param {String} [options.modelProp] - Set context.model given the path in the prop "modelProp".
 * @returns {Widget} A widget supporting connected props.
 */
export default function withC(Component, dispatchProps = {}, {modelProp} = {}) {
  // Component used after connect
  // It applies "inFunc" to the connected props and
  // prevents giving internal props (starting with "_") to the underlying component
  const ConnectedPropsMapper = (props) => {
    let {_connectedProps, _connectedProp, _model, ...otherProps} = props;
    const newProps = {};
    for (const prop of _connectedProps) {
      const inFunc = prop.inFunc;
      if (inFunc) {
        const name = prop.name;
        if (name === '_connectedProp') {
          if (Array.isArray(prop.fullPath)) {
            _connectedProp = inFunc(..._connectedProp);
          } else {
            _connectedProp = inFunc(_connectedProp);
          }
        } else {
          if (Array.isArray(prop.fullPath)) {
            newProps[name] = inFunc(...props[name]);
          } else {
            newProps[name] = inFunc(props[name]);
          }
        }
      }
    }
    // Do not spread an immutable to the props but spread it's content
    if (isShredderOrImmutable(_connectedProp)) {
      _connectedProp = _connectedProp.toObject();
    }
    if (modelProp) {
      const connectedModelProp = _connectedProps.find(
        (prop) => prop.name === modelProp
      );
      if (connectedModelProp) {
        const path = connectedModelProp.path;
        const model = Array.isArray(path) ? path[0] : path;
        return (
          <WithModel model={model}>
            <Component {...otherProps} {..._connectedProp} {...newProps} />
          </WithModel>
        );
      }
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
        if (Array.isArray(fullPath)) {
          value = fullPath.map((p) => state.get(p));
          // As 'value' is always a new array, define equals to prevent rerenders
          value.equals = arrayEquals;
        } else {
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
      this.addContextToPath = this.addContextToPath.bind(this);
    }

    getChildContext() {
      return {};
    }

    addContextToPath(path) {
      if (path === null || path === undefined) {
        return null;
      }
      const model = this.props._model || this.context.model;
      return joinModels(model, path);
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
      const connectedProps = [];
      const undefinedProps = {};

      for (const name of this.connectedPropNames) {
        const prop = this.props[name];
        prop.name = name;

        // Add context to path
        if (Array.isArray(prop.path)) {
          // Handle array of paths (for extra arguments to inFunc)
          prop.fullPath = prop.path.map(this.addContextToPath);
        } else {
          prop.fullPath = this.addContextToPath(prop.path);
        }

        if (prop.fullPath === null || prop.fullPath === undefined) {
          // No path, the prop will receive 'undefined'
          undefinedProps[name] = undefined;
        } else {
          // There is a path, add the prop to the list of connected props
          connectedProps.push(prop);

          // Setup a dispatch prop to change the prop value
          if (name in dispatchProps) {
            const dispatchPropName = dispatchProps[name];
            const outFunc = prop.outFunc;
            if (outFunc) {
              onChangeProps[dispatchPropName] = (value) =>
                this.handlePropChange(name, outFunc(value));
            } else {
              onChangeProps[dispatchPropName] = (value) =>
                this.handlePropChange(name, value);
            }
          }
        }
      }
      return (
        <ConnectedComponent
          {...onChangeProps}
          {...this.props}
          {...undefinedProps}
          _connectedProps={connectedProps}
        />
      );
    }

    // Render function used when there is no connected prop
    renderNotConnected() {
      const {_model, ...props} = this.props;
      return <Component {...props} />;
    }

    render() {
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
        return this.renderConnected();
      } else {
        return this.renderNotConnected();
      }
    }
  }

  WithC.propTypes = {};

  return (props) => (
    <ModelContext.Consumer>
      {(model) => <WithC _model={model} {...props} />}
    </ModelContext.Consumer>
  );
}
