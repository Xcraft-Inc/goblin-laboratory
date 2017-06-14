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

  goToContext (context) {
    this.nav (`/${context}`);
    //TODO: this.do ('setCurrent', {context});
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
                selected={current === k}
              />
            );
          })}
        </Container>
      );
    };
  }
}

export default Contexts;
