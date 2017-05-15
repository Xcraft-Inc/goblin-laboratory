import React from 'react';
import {Route, IndexRoute} from 'react-router';
import Hello from 'venture-trade-company/hello';
const Layout = () => {
  return <div>Layout</div>;
};

export default <Route exact path="/" component={Hello} />;
