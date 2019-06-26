import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import Shredder from 'xcraft-core-shredder';

export default function withC(Component, dispatchProps = {}) {
  const Mapper = props => {
    const {_connectedProps, ...otherProps} = props;
    const newProps = {};
    for (const prop of _connectedProps) {
      const inFunc = prop.get('inFunc');
      if (inFunc) {
        const name = prop.get('name');
        newProps[name] = inFunc(props[name]);
      }
    }
    return <Component {...otherProps} {...newProps} />;
  };

  const ConnectedComponent = Widget.connect(
    (state, props) => {
      const newProps = {};
      for (const prop of props._connectedProps) {
        const path = prop.get('path');
        let value;
        if (path !== null && path !== undefined) {
          value = state.get(path);
        }
        newProps[prop.get('name')] = value;
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
        if (
          Shredder.isShredder(value) &&
          value.get('_type') === 'connectedProp'
        ) {
          connectedPropNames.push(name);
        }
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
        // TODO: check model is not empty
        return `${model}${path}`;
      }
      return path;
    }

    handlePropChange(propName, value) {
      const path = this.addContextToPath(this.props[propName].get('path'));
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
        const path = this.addContextToPath(prop.get('path'));

        const dispatchPropName = dispatchProps[name];
        if (dispatchPropName) {
          const outFunc = prop.get('outFunc');
          if (outFunc) {
            onChangeProps[dispatchPropName] = value =>
              this.handlePropChange(name, outFunc(value));
          } else {
            onChangeProps[dispatchPropName] = value =>
              this.handlePropChange(name, value);
          }
        }

        return prop.set('name', name).set('path', path);
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
