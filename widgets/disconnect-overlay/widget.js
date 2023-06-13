import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import * as styles from './styles.js';
import Label from 'goblin-gadgets/widgets/label/widget';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

class DisconnectOverlay extends Widget {
  constructor() {
    super(...arguments);
    this.styles = styles;
  }

  render() {
    const {message} = this.props;

    const fullScreenClass = this.styles.classNames.fullScreen;
    const blinkClass = this.styles.classNames.blink;
    const messageClass = this.styles.classNames.message;

    return (
      <>
        <div className={fullScreenClass}>
          <div className={blinkClass}>
            <FontAwesomeIcon icon={['fas', 'network-wired']} size="10x" />
          </div>
          <Label
            className={messageClass}
            height="200px"
            justify="center"
            kind="footer"
            fontSize="300%"
            text={message}
          />
        </div>
        {this.props.children}
      </>
    );
  }
}

export default DisconnectOverlay;
