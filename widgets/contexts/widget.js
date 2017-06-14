import React from 'react';
import Button from 'gadgets/button/widget';
import Widget from 'laboratory/widget';
import Container from 'gadgets/container/widget';

class Contexts extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  get wiring () {
    return {
      id: 'id',
      contexts: 'contexts',
      current: 'current',
    };
  }

  goToContext (contextId) {
    this.do ('set-current', {contextId});
    this.navToContext (contextId);
  }

  widget () {
    return props => {
      const {contexts, current} = props;
      return (
        <Container kind="main-tab">
          {contexts.map ((v, k) => {
            return (
              <Button
                key={k}
                id={k}
                onClick={() => this.goToContext (v)}
                active={current === v ? 'true' : 'false'}
              />
            );
          })}
        </Container>
      );
    };
  }
}

export default Contexts;
