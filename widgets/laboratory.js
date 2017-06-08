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
      const routes = routesMap.select ((k, v) => {
        return {path: v, component: k};
      });
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
              </Container>
            </Container>
            <Container kind="right">
              <Container kind="content">
                <Container kind="top-bar" />
                {routes.map ((route, i) => {
                  return (
                    <Route
                      key={i}
                      path={route.path}
                      component={viewImporter (route.component)}
                    />
                  );
                })}
              </Container>
              <span>{id}</span>
            </Container>
          </Container>
        </ConnectedRouter>
      );
    };
  }
}

export default Laboratory;
