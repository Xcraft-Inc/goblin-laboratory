import Widget from 'laboratory/widget';
import React from 'react';

export default Component => {
  const ConnectedComponent = Widget.connect(
    (state, props) => {
      const {model, ...otherProps} = props;
      return Object.entries(otherProps).reduce((properties, [key, path]) => {
        if (key === 'value') {
          properties[key] = path;
          return properties;
        }

        if (typeof path !== 'string') {
          properties[key] = path;
          return properties;
        }

        if (path.startsWith('$')) {
          properties[key] = path.substring(1);
          return properties;
        }

        //do binding
        if (path.startsWith('.')) {
          path = `${model}${path}`;
        }

        if (path.startsWith('backend.') || path.startsWith('widgets.')) {
          properties[key] = state.get(path);
        } else {
          properties[key] = state.get(`newForms.${path}.value`);
        }
        return properties;
      }, {});
    },
    () => ({}) // Do not add "dispatch" to the props
  )(Component);

  return class PropsBinder extends Widget {
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
