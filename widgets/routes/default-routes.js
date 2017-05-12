import React from 'react';
import {Route, IndexRoute} from 'react-router';

export default (
  <Route path="/" component={Layout}>
    <IndexRoute component={Loading} />
  </Route>
);
