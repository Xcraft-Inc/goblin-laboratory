import React from 'react';
import Widget from 'laboratory/widget';
import Markdown from 'react-markdown';
import importer from '../importer/';

const contentImporter = importer ('content');

class Content extends Widget {
  constructor (props) {
    super (props);
  }

  render () {
    const {widgetName} = this.props;
    const source = contentImporter (widgetName);
    return <Markdown source={source} />;
  }
}

export default Content;
