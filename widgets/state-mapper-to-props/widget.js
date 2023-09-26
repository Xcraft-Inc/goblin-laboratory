import Widget from 'goblin-laboratory/widgets/widget';

export default function stateMapperToProps(Component, mapper, path) {
  if (!mapper) {
    return Component;
  }
  return Widget.connect((state, props) => {
    const model = path;
    if (typeof mapper === 'function') {
      return Object.assign({model}, mapper(state.get(model), props));
    } else {
      return {
        model,
        [mapper]: state.get(model),
      };
    }
  })(Component);
}
