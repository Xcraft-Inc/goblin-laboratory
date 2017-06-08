import React from 'react';
import Widget from 'laboratory/widget';
import {ConnectedRouter} from 'react-router-redux';
import {Route} from 'react-router';
import Container from 'gadgets/container';
import Button from 'gadgets/button';
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
      const routes = {
        '/': [],
        '/task-bar/': [],
        '/top-bar/': [],
        '/content/': [],
      };
      routesMap.select ((k, v) => {
        const ex = /^\/.*\//;
        let mount = ex.exec (v);
        if (!mount) {
          mount = '/';
        }
        if (routes[mount]) {
          routes[mount].push ({path: v.replace (mount, '/'), component: k});
        } else {
          console.warn (`Invalid mount point ${mount} for ${k}`);
        }
      });
      console.dir (routes);
      return (
        <ConnectedRouter history={history}>
          <Container kind="root">
            <Container kind="left-bar">
              <Container kind="task-bar">
                <Button
                  text-transform="none"
                  tooltip="Changer de mandat"
                  kind="task-logo"
                />
                {routes['/task-bar/'].map ((route, i) => {
                  return (
                    <Route
                      key={i}
                      path={route.path}
                      component={viewImporter (route.component)}
                    />
                  );
                })}
              </Container>
            </Container>
            <Container kind="right">
              <Container kind="content">
                <Container kind="top-bar">
                  {routes['/top-bar/'].map ((route, i) => {
                    return (
                      <Route
                        key={i}
                        path={route.path}
                        component={viewImporter (route.component)}
                      />
                    );
                  })}
                </Container>
                {routes['/content/'].map ((route, i) => {
                  return (
                    <Route
                      key={i}
                      path={route.path}
                      component={viewImporter (route.component)}
                    />
                  );
                })}
              </Container>
              {routes['/'].map ((route, i) => {
                return (
                  <Route
                    key={i}
                    path={route.path}
                    component={viewImporter (route.component)}
                  />
                );
              })}
              <Container kind="footer">
                <span>{id}</span>
              </Container>
            </Container>
          </Container>
        </ConnectedRouter>
      );
    };
  }
}

export default Laboratory;
