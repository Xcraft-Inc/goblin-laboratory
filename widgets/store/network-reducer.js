import {fromJS} from 'immutable';

const initialState = fromJS({
  disconnected: false,
  message: '...',
  latency: {},
});

export default (state = initialState, action = {}) => {
  if (action.type === 'SET_DISCONNECTED') {
    return state
      .set('disconnected', action.disconnected)
      .set('message', action.message);
  }

  if (action.type === 'PUSH_LATENCY') {
    let latency = state.getIn(['latency', action.horde]) || fromJS([]);
    latency = latency.unshift(action.latency);
    if (latency.size > 10) {
      latency = latency.skipLast(1);
    }
    return state.setIn(['latency', action.horde], latency);
  }

  return state;
};
