import React from 'react';
import Widget from 'laboratory/widget';
import Button from 'gadgets/button/widget';

class NotificationsButton extends Widget {
  constructor (props) {
    super (props);
  }

  static get wiring () {
    return {
      id: 'id',
      notReadCount: 'notReadCount',
    };
  }

  componentDidMount () {
    super.componentDidMount ();

    if (!window.document.notificationsButtons) {
      window.document.notificationsButtons = [];
    }
    window.document.notificationsButtons.push (this);
  }

  componentWillUnmount () {
    const index = window.document.notificationsButtons.indexOf (this);
    if (index !== -1) {
      window.document.notificationsButtons.splice (index, 1);
    }
  }

  render () {
    return (
      <Button
        text="Notifications"
        glyph="bell"
        glyph-position="right"
        kind="view-tab-right"
        badge-value={this.props.notReadCount}
        onClick={() => this.doAs ('laboratory', 'toggle-notifications')}
      />
    );
  }
}

export default NotificationsButton;
