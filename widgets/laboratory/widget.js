import React from 'react';
import Widget from 'laboratory/widget';
import {Route} from 'react-router';
import Container from 'gadgets/container/widget';
import Button from 'gadgets/button/widget';
import importer from '../importer/';

const viewImporter = importer ('view');

class Laboratory extends Widget {
  constructor (props) {
    super (props);
  }

  shouldComponentUpdate (nP) {
    return nP.location !== this.props.location;
  }

  static get wiring () {
    return {
      id: 'id',
      routesMap: 'routes',
    };
  }

  render () {
    const {id, routesMap} = this.props;
    const routes = {
      '/': {},
      '/task-bar/': {},
      '/top-bar/': {},
      '/before-content/': {},
      '/content/': {},
    };

    routesMap.select ((k, v) => {
      const ex = /^(\/.[:\-a-z]+\/).*/;
      const res = ex.exec (v);
      let mount = '/';
      if (res) {
        mount = res[1];
      }
      if (routes[mount]) {
        routes[mount] = {path: v.replace (mount, '/'), component: k};
      } else {
        console.warn (`Invalid mount point ${mount} for ${k}`);
      }
    });

    console.log ('RENDERING LABORATORY');
    return (
      <Container kind="root">
        <Container kind="left-bar">
          <Container kind="task-bar">
            <Button
              text-transform="none"
              tooltip="Changer de mandat"
              kind="task-logo"
            />
            <Route
              path={routes['/task-bar/'].path}
              labId={this.props.id}
              component={viewImporter (routes['/task-bar/'].component)}
            />
          </Container>
        </Container>
        <Container kind="right">
          <Container kind="content">
            <Container kind="top-bar">
              <Route
                path={routes['/top-bar/'].path}
                labId={this.props.id}
                component={viewImporter (routes['/top-bar/'].component)}
              />
            </Container>
            <Route
              path={routes['/before-content/'].path}
              labId={this.props.id}
              component={viewImporter (routes['/before-content/'].component)}
            />
            <Route
              path={routes['/content/'].path}
              labId={this.props.id}
              component={viewImporter (routes['/content/'].component)}
            />
          </Container>
          <Route
            path={routes['/'].path}
            labId={this.props.id}
            component={viewImporter (routes['/'].component)}
          />
          <Container kind="footer">
            <span>{id}</span>
          </Container>
        </Container>
      </Container>
    );
  }
}

export default Laboratory;
