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

  widget () {
    return props => {
      const {context, workitem} = props;
      if (!workitem) {
        return null;
      }
      const WorkItemView = viewImporter (workitem);
      return (
        <Container kind="views">
          <Container kind="view" width="800px">
            <WorkItemView />
          </Container>
        </Container>
      );
    };
  }
}

export default WorkItem;
