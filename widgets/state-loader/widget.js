import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';

class StateLoader extends Widget {
  render() {
    const {loading, children, FallbackComponent} = this.props;
    if (loading) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }
    return children;
  }
}

export default Widget.connect((state, props) => {
  // Get path or fallback on fullPath
  let path = props.path ? `backend.${props.path}.id` : null;
  path = path || props.fullPath;
  // Check state is loaded
  const loaded = state.get(path);
  if (!loaded) {
    return {loading: true};
  }
  return {};
})(StateLoader);
