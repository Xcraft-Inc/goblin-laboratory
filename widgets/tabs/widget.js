import React from 'react';
import Button from 'gadgets/button/widget';
import Widget from 'laboratory/widget';
import Container from 'gadgets/container/widget';

class Tabs extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  goToWorkItem (context, wid) {
    this.nav (`/${context}/${wid}`);
  }

  widget () {
    return props => {
      const context = props.context;
      return (
        <Container kind="second-bar">
          <Container kind="view-tab">
            <Button
              kind="view-tab"
              text={`${context} - Activity 1`}
              onClick={() => this.goToWorkItem (context, 'venture')}
            />
            <Button
              kind="view-tab"
              text={`${context} - Activity 2`}
              onClick={() => this.goToWorkItem (context, 'company')}
            />
          </Container>
        </Container>
      );
    };
  }
}

export default Tabs;
