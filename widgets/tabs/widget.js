import React from 'react';
import Button from 'gadgets/button/widget';
import Widget from 'laboratory/widget';
import Container from 'gadgets/container/widget';
const Wired = Widget.Wired (Button);
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

  goToWorkItem (contextId, workItemId) {
    this.do ('set-current', {contextId, workItemId});
    this.navToWorkItem (contextId, workItemId);
  }

  render () {
    const {context, current, tabs} = this.props;
    let currentTab = null;
    if (current) {
      currentTab = current.get (context, null);
    }
    const contextTabs = tabs.get (context, []);
    return (
      <Container kind="second-bar">
        <Container kind="view-tab">
          {contextTabs.map ((v, k) => {
            const WiredButton = Wired (k);
            return (
              <WiredButton
                key={k}
                id={k}
                onClick={() => this.goToWorkItem (context, v)}
                active={currentTab === v ? 'true' : 'false'}
              />
            );
          })}
        </Container>
      </Container>
    );
  }
}

export default Tabs;
