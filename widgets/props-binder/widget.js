import Widget from 'laboratory/widget';
import React from 'react';

export default Component => {
  const ConnectedComponent = Widget.connect(
    (state, props) => {
      const {model, ...otherProps} = props;
      return Object.entries(otherProps).reduce((properties, [key, path]) => {
        if (key === 'value') {
          return properties;
        }

        //do binding
        if (path.startsWith('.')) {
          path = `${model}${path}`;
          properties[key] = state.get(path);
          return properties;
        } else if (path.startsWith('state.')) {
          path = `${path.substring(2)}`;
          properties[key] = state.get(path);
          return properties;
        }

        return properties;
      }, {});
    },
    () => ({}) // Do not add "dispatch" to the props
  )(Component);

  return class PropsBinder extends Widget {
    constructor() {
      super(...arguments);

      if (this.context.register) {
        this.context.register(this.props);
      }
    }

    render() {
      return (
        <ConnectedComponent
          {...this.props}
          model={this.props.model || this.context.model}
        />
      );
    }
  };
};
