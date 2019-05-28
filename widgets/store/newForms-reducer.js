import Shredder from 'xcraft-core-shredder';

const wrapReducer = reducer => (state, action) => {
  if (state) {
    state = new Shredder(state);
  }
  const nState = reducer(state, action);
  if (Shredder.isShredder(nState)) {
    return nState.state;
  }
  return nState;
};

export default wrapReducer((state = new Shredder({}), action = {}) => {
  if (action.type === 'FIELD-FOCUS') {
    return state
      .set(`${action.path}.edit`, true)
      .set(`${action.path}.raw`, action.value);
  }
  if (action.type === 'FIELD-BLUR') {
    return state.set(`${action.path}.edit`, false);
  }
  if (action.type === 'FIELD-CHANGED') {
    if (
      action.path.startsWith('backend.') ||
      action.path.startsWith('widgets.')
    ) {
      return state;
    }
    return state.set(`${action.path}.value`, action.value);
  }
  if (action.type === 'FIELD-RAW-CHANGED') {
    return state.set(`${action.path}.raw`, action.value);
  }
  return state;
});
