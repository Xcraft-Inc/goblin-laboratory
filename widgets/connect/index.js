import React from 'react';
import Widget from 'laboratory/widget';

class ConnectedElement extends Widget {
  render() {
    const {children} = this.props;
    const childProps = {};

    // Forward props to children (real component that has to be connected)
    Object.keys(this.props).map(key => {
      if (key !== 'children') {
        if (key === 'key') {
          childProps[key] = this.props[key] ? this.props[key] + '_item' : null;
        } else {
          childProps[key] = this.props[key];
        }
      }
    });

    return <children.type {...children.props} {...childProps} />;
  }
}

class Connect extends Widget {
  render() {
    const {id, key, children} = this.props;
    const self = this;

    function constructConnection(state) {
      const connection = {};

      Object.keys(self.props).map(key => {
        if (
          key !== 'children' &&
          key !== 'key' &&
          key !== 'do' &&
          key !== 'id'
        ) {
          try {
            if (typeof self.props[key] === 'function') {
              connection[key] = self.props[key](state);
            } else {
              console.error('connected key ' + key + ' is not a function');
            }
          } catch (err) {
            console.error('error connecting key ' + key + ': ');
            console.error(err);
          }
        }
      });

      return connection;
    }

    const Element = Widget.connect(state => constructConnection(state))(
      ConnectedElement
    );

    return (
      <Element do={self.props.do} id={id} key={key ? key + '_connected' : null}>
        {children}
      </Element>
    );
  }
}

export default Connect;
