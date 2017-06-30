import React from 'react';
import Button from 'gadgets/button/widget';
import Widget from 'laboratory/widget';
import Container from 'gadgets/container/widget';
import NotificationsButton from 'laboratory/notifications-button/widget';

const wireButton = Widget.Wired (Button);
const wireNotifsButton = Widget.Wired (NotificationsButton);
class Tabs extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  static get wiring () {
    return {
      id: 'id',
      tabs: 'tabs',
      current: 'current',
    };
  }

  goToWorkItem (contextId, view, workItemId) {
    this.do ('set-current', {contextId, workItemId});
    this.navToWorkItem (contextId, view, workItemId);
  }

  render () {
    const {isDisplayed, context, current, tabs} = this.props;

    if (!isDisplayed) {
      return null;
    }

    let currentTab = null;
    if (current) {
      currentTab = current.get (context, null);
    }

    const WiredNotificationsButton = wireNotifsButton (this.context.labId);

    const contextTabs = tabs.get (context, []);
    return (
      <Container kind="second-bar">
        <Container kind="view-tab">
          {contextTabs.map ((v, k) => {
            const WiredButton = wireButton (k);
            const wid = v.get ('workItemId');
            return (
              <WiredButton
                key={k}
                id={k}
                onClick={() => this.goToWorkItem (context, v.get ('view'), wid)}
                active={currentTab === wid ? 'true' : 'false'}
              />
            );
          })}
        </Container>
        <Container kind="view-tab-right">
          <WiredNotificationsButton />
        </Container>
      </Container>
    );
  }
}

export default Widget.Wired (Tabs) ('tabs@default');
