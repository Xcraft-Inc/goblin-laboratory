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
        //const Comp = __webpack_require__ ('../../' + name).default;
        //console.log (`Creating route ${route} for ${name}`);
        return <Route key={i} path={route} render={() => <h1>{name}</h1>} />;
      })}
    </div>
  );
};

export default wire ({widgets: 'laboratory.widgets'}) (Routes);
