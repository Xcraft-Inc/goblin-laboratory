import React from 'react';
import Widget from 'laboratory/widget';
import Container from 'gadgets/container/widget';
import Button from 'gadgets/button/widget';
import importer from '../importer/';

const viewImporter = importer ('view');

class Laboratory extends Widget {
  constructor (props) {
    super (props);
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
      '/hinter/': {},
      '/task-bar/': {},
      '/top-bar/': {},
      '/before-content/': {},
      '/content/': {},
    };

    this.shred (routesMap).select ((k, v) => {
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

    const taskView = viewImporter (routes['/task-bar/'].component);
    const Tasks = Widget.WithRoute (taskView, 'context') (
      routes['/task-bar/'].path
    );

    const contentView = viewImporter (routes['/content/'].component);
    const Content = Widget.WithRoute (contentView, 'view') (
      routes['/content/'].path
    );

    const topbarView = viewImporter (routes['/top-bar/'].component);
    const TopBar = Widget.WithRoute (topbarView, 'context') (
      routes['/top-bar/'].path
    );

    const beforeView = viewImporter (routes['/before-content/'].component);
    const BeforeContent = Widget.WithRoute (beforeView, 'context') (
      routes['/before-content/'].path
    );

    return (
      <Container kind="root">
        <Container kind="left-bar">
          <Container kind="task-bar">
            <Button
              text-transform="none"
              tooltip="Changer de mandat"
              kind="task-logo"
            />
            <Tasks />
          </Container>
        </Container>
        <Container kind="right">
          <Container kind="content">
            <Container kind="top-bar">
              <TopBar />
            </Container>
            <BeforeContent />
            <Content />
          </Container>
          <Container kind="footer">
            <span>{id}</span>
          </Container>
        </Container>
      </Container>
    );
  }
}

export default Laboratory;
