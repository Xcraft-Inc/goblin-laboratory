export default (state = {}, action = {}) => {
  if (action.type === 'NEW_BACKEND_STATE') {
    return action.newAppState;
  }
  return state;
};
