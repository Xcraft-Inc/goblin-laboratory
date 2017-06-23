import React from 'react';
import Widget from 'laboratory/widget';
import importer from 'laboratory/importer/';

const viewImporter = importer ('view');
class WorkItem extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  render () {
    const {match} = this.props;
    const view = match.params.view;

    if (!view) {
      return null;
    }

    const View = viewImporter (view);
    return (
      <View workitem={this.getWorkItemId ()} hinterid={this.getHinterId} />
    );
  }
}

export default WorkItem;
