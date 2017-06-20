import React from 'react';
import Widget from 'laboratory/widget';
import Container from 'gadgets/container/widget';
import Button from 'gadgets/button/widget';
import Label from 'gadgets/label/widget';
import importer from 'laboratory/importer/';

const viewImporter = importer ('view');
class WorkItem extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  render () {
    const {context, workitem} = this.props;
    if (!workitem) {
      return null;
    }
    const WorkItemView = viewImporter (workitem);
    return <WorkItemView />;
  }
}

export default WorkItem;
