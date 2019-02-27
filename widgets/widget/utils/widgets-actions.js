//T:2019-02-27

export function collect() {
  return (dispatch, getState) => {
    const state = getState();
    const backendState = state.backend;
    const ids = state.widgets
      .keySeq()
      .filter(id => {
        if (typeof id === 'string') {
          id = id.split('$')[0];
        }
        return id && !backendState.has(id);
      })
      .toArray();
    if (ids.length > 0) {
      return dispatch({type: 'WIDGETS_COLLECT', ids});
    }
  };
}
