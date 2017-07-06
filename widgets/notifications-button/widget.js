import React from 'react';
import Widget from 'laboratory/widget';

import Button from 'gadgets/button/widget';
import Notifications from 'gadgets/notifications/widget';

const wiredNotifications = Widget.Wired (Notifications);

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

  renderNofications () {
    const WiredNotifications = wiredNotifications (this.props.id);
    const boxClass = this.styles.classNames.notificationsBox;

    return (
      <div className={boxClass}>
        <WiredNotifications />
      </div>
    );
  }

  render () {
    const boxClass = this.styles.classNames.box;
    const anchorClass = this.styles.classNames.anchor;

    return (
      <div className={boxClass}>
        <Button
          text="Notifications"
          glyph="bell"
          glyphPosition="right"
          kind="view-tab-right"
          badge-value={this.props.notReadCount}
          onClick={() => this.doAs ('laboratory', 'toggle-notifications')}
        />
        <div className={anchorClass}>
          {this.renderNofications ()}
        </div>
      </div>
    );
  }
}

export default NotificationsButton;
