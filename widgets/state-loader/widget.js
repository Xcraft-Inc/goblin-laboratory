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
  // Check state is loaded
  const loaded = state.get(`backend.${props.path}.id`);
  if (!loaded) {
    return {loading: true};
  }
  return {};
})(StateLoader);
