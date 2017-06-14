import React from 'react';
import Tasks from 'laboratory/tasks/widget';

const TasksView = ({match}) => <Tasks context={match.params.context} />;

export default TasksView;
