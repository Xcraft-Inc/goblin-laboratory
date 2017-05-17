import React from 'react';
import {Route, IndexRoute} from 'react-router';
import {push} from 'react-router-redux';
import {wire} from 'laboratory/wire';

const Layout = () => {
  return <div>Layout</div>;
};

const Routes = props => {
  return (
    <div>
      <Route path="/" render={() => <h1>Default Route</h1>} />
      {props.widgets.select ((w, i) => {
        const route = w.get ('route');
        const name = w.get ('widget');
        return (
          <Route
            key={i}
            path={route}
            getComponent={(location, cb) => {
              console.log (`will load: ../../goblin-${name}`);
              import (`../../goblin-${name}`).then (module =>
                cb (null, module.default)
              );
            }}
          />
        );
      })}
    </div>
  );
};

export default wire ({widgets: 'laboratory.widgets'}) (Routes);
