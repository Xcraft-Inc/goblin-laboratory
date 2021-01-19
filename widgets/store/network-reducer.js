import {fromJS} from 'immutable';

const initialState = fromJS({
  disconnected: false,
  message: '...',
});

export default (state = initialState, action = {}) => {
  if (action.type === 'SET_DISCONNECTED') {
    return state
      .set('disconnected', action.disconnected)
      .set('message', action.message);
  }

  return state;
};
