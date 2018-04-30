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
        <Container kind="column" grow="1">
          <Label
            grow="1"
            justify="center"
            kind="footer"
            glyph="solid/lock"
            glyphSize="1000%"
          />
          <Label
            grow="1"
            justify="center"
            kind="footer"
            fontSize="300%"
            text={status}
          />
          <Label
            grow="1"
            justify="center"
            kind="footer"
            fontSize="300%"
            text={progress}
          />
          <Label
            grow="1"
            justify="center"
            kind="footer"
            fontSize="300%"
            text={message}
          />
        </Container>
      </Container>
    );
  }
}

export default Widget.Wired(Maintenance)('workshop');
