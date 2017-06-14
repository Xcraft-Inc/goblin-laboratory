import React from 'react';
import Button from 'gadgets/button/widget';
import Widget from 'laboratory/widget';
import Container from 'gadgets/container/widget';

class Tabs extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  get wiring () {
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

  widget () {
    return props => {
      const {context, current, tabs} = props;
      let currentTab = null;
      if (current) {
        currentTab = current.get (context, null);
      }
      const contextTabs = tabs.get (context, []);
      return (
        <Container kind="second-bar">
          <Container kind="view-tab">
            {contextTabs.map ((v, k) => {
              return (
                <Button
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
    };
  }
}

export default Tabs;
