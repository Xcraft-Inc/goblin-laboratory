import React from 'react';
import Widget from 'laboratory/widget';
import {ConnectedRouter} from 'react-router-redux';
import {Route} from 'react-router';
import importer from './importer';
const viewImporter = importer ('view');

class Laboratory extends Widget {
  constructor (props) {
    super (props);
  }

  get wiring () {
    return {
      id: 'id',
      routesMap: 'routes',
    };
  }

  widget () {
    return props => {
      const {id, history, routesMap} = props;
      const routes = routesMap.select ((k, v) => {
        return {path: v, component: k};
      });
      return (
        <section>
          <span>{id}</span>
          <ConnectedRouter history={history}>
            <div>
              {routes.map ((route, i) => {
                return (
                  <Route
                    key={i}
                    path={route.path}
                    component={() => viewImporter (route.component)}
                  />
                );
              })}
            </div>
          </ConnectedRouter>
        </section>
      );
    };
  }
}

export default Laboratory;
