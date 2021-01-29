import {fromJS} from 'immutable';

const initialState = fromJS({
  disconnected: false,
  message: '...',
  jitter: {},
  noJitter: false,
});

export default (state = initialState, action = {}) => {
  if (action.type === 'SET_DISCONNECTED') {
    return state
      .set('disconnected', action.disconnected)
      .set('message', action.message);
  }

  if (action.type === 'PUSH_JITTER') {
    let jitter = state.getIn(['jitter', action.horde]) || fromJS([]);
    jitter = jitter.unshift(action.jitter);
    if (jitter.size > 10) {
      jitter = jitter.skipLast(1);
    }
    return state.set('noJitter', false).setIn(['jitter', action.horde], jitter);
  }

  if (action.type === 'NO_JITTER') {
    return state.set('noJitter', true);
  }

  return state;
};
