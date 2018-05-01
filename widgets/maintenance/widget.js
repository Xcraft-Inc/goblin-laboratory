import React from 'react';

import Widget from 'laboratory/widget';
import Container from 'gadgets/container/widget';
import Label from 'gadgets/label/widget';
import Gauge from 'gadgets/gauge/widget';

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

    const fullScreenClass = this.styles.classNames.fullScreen;
    const gaugeClass = this.styles.classNames.gauge;

    return (
      <div className={fullScreenClass}>
        <Label
          height="350px"
          justify="center"
          kind="footer"
          glyphPosition="center"
          glyph="solid/lock"
          glyphSize="1000%"
        />
        <div className={gaugeClass}>
          <Gauge
            kind="rounded"
            gradient="red-yellow-green"
            width="300px"
            height="10px"
            direction="horizontal"
            value={progress * 100}
          />
        </div>
        <Label
          height="200px"
          justify="center"
          kind="footer"
          fontSize="300%"
          text={message}
        />
      </div>
    );
  }
}

export default Widget.Wired(Maintenance)('workshop');
