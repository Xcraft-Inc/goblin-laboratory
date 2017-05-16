import React from 'react';
import {Route, IndexRoute} from 'react-router';
import Hello from 'venture-trade-company/hello';
import {wire} from 'laboratory/wire';

const Layout = () => {
  return <div>Layout</div>;
};

const importWidget = wName => {
  return require (wName).default;
};

const Routes = props => {
  const routes = props.widgets;
  return (
    <div>
      {routes.map ((w, i) => {
        return (
          <Route
            key={i}
            exact
            path={w.get ('route')}
            component={importWidget (w.get ('widgetName'))}
          />
        );
      })}
    </div>
  );
};

export default wire ({widgets: 'laboratory.widgets'}) (Routes);
