import React from 'react';
import Button from 'gadgets/button/widget';
import Widget from 'laboratory/widget';
import Container from 'gadgets/container/widget';
const Wired = Widget.Wired (Button);

class Contexts extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  static get wiring () {
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

  render () {
    const {params, contexts, current} = this.props;
    if (!params) {
      return null;
    }
    return (
      <Container kind="main-tab">
        {contexts.map ((v, k) => {
          const WiredButton = Wired (k);
          return (
            <WiredButton
              key={k}
              id={k}
              onClick={() => this.goToContext (v)}
              active={current === v ? 'true' : 'false'}
            />
          );
        })}
      </Container>
    );
  }
}

export default Widget.Wired (Contexts) ('contexts@default');
