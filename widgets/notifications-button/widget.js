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
