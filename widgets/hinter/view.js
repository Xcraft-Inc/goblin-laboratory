import React from 'react';
import Widget from 'laboratory/widget';
import {Route} from 'react-router';
import Hinter from 'laboratory/hinter/widget';
class HinterView extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  render () {
    return <Route path="/:context/:view/:hinter" component={Hinter} />;
  }
}

export default HinterView;
