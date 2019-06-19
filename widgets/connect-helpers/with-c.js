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
        newProps[prop.get('name')] = state.get(prop.get('path'));
      }
      return newProps;
    },
    () => ({}) // Do not add "dispatch" to the props
  )(Mapper);

  class WithC extends Widget {
    constructor() {
      super(...arguments);

      const connectedProps = [];
      const onChangeProps = {};
      for (const [name, value] of Object.entries(this.props)) {
        if (
          Shredder.isShredder(value) &&
          value.get('_type') === 'connectedProp'
        ) {
          //TODO handle array of path (for extra arguments to inFunc)
          let path = this.addContextToPath(value.get('path'));
          const newValue = value.set('name', name).set('path', path);
          connectedProps.push(newValue);

          const dispatchPropName = dispatchProps[name];
          if (dispatchPropName) {
            let outFunc = value.get('outFunc');
            if (!outFunc) {
              outFunc = value => value;
            }
            onChangeProps[dispatchPropName] = value => {
              return this.handlePropChange(name, outFunc(value));
            };
          }
        }
      }
      if (connectedProps.length > 0) {
        this.connectedProps = connectedProps;
        this.onChangeProps = onChangeProps;
        this.render = this.renderConnected;
      } else {
        this.render = this.renderNotConnected;
      }
    }

    addContextToPath(path) {
      if (path.startsWith('.')) {
        const model = this.props.model || this.context.model;
        path = `${model}${path}`;
      }
      return path;
    }

    handlePropChange(propName, value) {
      const path = this.addContextToPath(this.props[propName].get('path'));
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
      return (
        <ConnectedComponent
          {...this.onChangeProps}
          {...this.props}
          _connectedProps={this.connectedProps}
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
