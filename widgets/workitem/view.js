import React from 'react';
import Widget from 'laboratory/widget';
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
