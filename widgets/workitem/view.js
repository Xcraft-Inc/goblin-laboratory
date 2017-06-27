import React from 'react';
import Widget from 'laboratory/widget';
import importer from 'laboratory/importer/';
const viewImporter = importer ('view');
class WorkItem extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  render () {
    const {view} = this.props;

    if (!view) {
      return null;
    }

    const View = viewImporter (view);
    const wid = this.getWorkItemId ();
    return <View workitem={wid} />;
  }
}

export default WorkItem;
