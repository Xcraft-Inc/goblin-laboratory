import React from 'react';
import {Route, IndexRoute} from 'react-router';
import Hello from 'venture-trade-company/hello';
import {wire} from 'laboratory/wire';

const Layout = () => {
  return <div>Layout</div>;
};

const ImportWidget = props => {
  return <span>todo: dynamic import {props.name}</span>;
};

const renderRoutes = routes => {
  const res = routes.select ((w, i) => {
    const route = w.get ('route');
    const name = w.get ('widget');
    return (
      <Route
        key={i}
        path={route}
        render={() => <span>todo: require ({name})</span>}
      />
    );
  });
  return res;
};

const Routes = props => {
  const routes = props.widgets;

  return (
    <div>
      {renderRoutes (routes)}
    </div>
  );
};

export default wire ({widgets: 'laboratory.widgets'}) (Routes);
