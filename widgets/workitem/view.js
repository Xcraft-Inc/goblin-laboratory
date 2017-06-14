import React from 'react';
import WorkItem from 'laboratory/workitem/widget';

const WorkItemView = ({match}) => (
  <WorkItem workitem={match.params.workitem} context={match.params.context} />
);

export default WorkItemView;
