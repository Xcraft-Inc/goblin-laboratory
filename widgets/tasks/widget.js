import React from 'react';
import Button from 'gadgets/button/widget';
import Widget from 'laboratory/widget';
import Container from 'gadgets/container/widget';

class Tasks extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  widget () {
    return props => {
      const context = props.context;
      return <Container kind="task-bar" />;
    };
  }
}

export default Tasks;
