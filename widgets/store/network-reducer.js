import {fromJS} from 'immutable';

const initialState = fromJS({
  disconnected: false,
  message: '...',
  jitter: {},
  noJitter: false,
});

function unshift(jitter, newValue) {
  jitter = jitter.unshift(newValue);
  if (jitter.size > 60) {
    jitter = jitter.skipLast(1);
  }
  return jitter;
}

export default (state = initialState, action = {}) => {
  if (action.type === 'SET_DISCONNECTED') {
    return state
      .set('disconnected', action.disconnected)
      .set('message', action.message);
  }

  if (action.type === 'PUSH_JITTER') {
    let jitter = state.getIn(['jitter', action.horde]) || fromJS([]);
    jitter = unshift(jitter, action.jitter);
    return state.set('noJitter', false).setIn(['jitter', action.horde], jitter);
  }

  if (action.type === 'NO_JITTER') {
    let jitter = state.getIn(['jitter', action.horde]) || fromJS([]);
    jitter = unshift(jitter, 1000);
    return state.set('noJitter', true).setIn(['jitter', action.horde], jitter);
  }

  return state;
};
