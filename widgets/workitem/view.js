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

  shouldComponentUpdate (nP) {
    return nP.match.params.workitem !== this.props.match.params.workitem;
  }

  render () {
    const {match} = this.props;
    const workitem = match.params.workitem;
    if (!workitem) {
      return null;
    }
    const WorkItemView = viewImporter (workitem);
    return <WorkItemView />;
  }
}

export default WorkItem;
