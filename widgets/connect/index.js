import React from 'react';
import Widget from 'laboratory/widget';

class ConnectedElement extends Widget {
  render() {
    const {children, ...childProps} = this.props;
    return <children.type {...children.props} {...childProps} />;
  }
}

function constructConnection(state, props) {
  const connection = {};

  Object.keys(props).forEach(key => {
    if (key !== 'children' && key !== 'key') {
      try {
        if (typeof props[key] === 'function') {
          connection[key] = props[key](state);
        } else {
          console.error('Connect: connected key ' + key + ' is not a function');
        }
      } catch (err) {
        console.error('Connect: error connecting key ' + key + ': ');
        console.error(err);
      }
    }
  });

  return connection;
}

const Connect = Widget.connect(constructConnection)(ConnectedElement);

export default Connect;
