import React from 'react';
import WorkItem from 'laboratory/workitem/widget';
import View from 'laboratory/view';

class WorkItemView extends View {
  shouldComponentUpdate (nP) {
    return nP.match.params.workitem !== this.props.match.params.workitem;
  }
  render () {
    const {match} = this.props;
    return (
      <WorkItem
        workitem={match.params.workitem}
        context={match.params.context}
      />
    );
  }
}

export default WorkItemView;
