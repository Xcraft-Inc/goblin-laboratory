import React from 'react';

import Widget from 'laboratory/widget';
import Container from 'gadgets/container/widget';
import Label from 'gadgets/label/widget';

class Maintenance extends Widget {
  constructor() {
    super(...arguments);
  }

  static get wiring() {
    return {
      id: 'id',
      status: 'maintenance.status',
      progress: 'maintenance.progress',
      message: 'maintenance.message',
    };
  }

  render() {
    const {id, status, progress, message} = this.props;

    if (!id) {
      return null;
    }

    return (
      <Container kind="root">
        <Label text={status} />
        <Label text={progress} />
        <Label text={message} />
      </Container>
    );
  }
}

export default Widget.Wired(Maintenance)('workshop');
