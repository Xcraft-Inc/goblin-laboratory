import Widget from 'goblin-laboratory/widgets/widget';

class CollectionLoader extends Widget {
  constructor() {
    super(...arguments);
  }

  render() {
    const {loading, collection, children} = this.props;
    if (loading) {
      return null;
    }

    return collection ? children(collection) : children;
  }
}

export default Widget.connect((state, props) => {
  // Check state is loaded for all entities
  const loaded = props.ids.every((id) => state.get(`backend.${id}`));
  if (!loaded) {
    return {loading: true};
  }
  if (typeof props.children !== 'function') {
    return {};
  }
  const collection = props.ids.map((id) => state.get(`backend.${id}`));
  return {collection};
})(CollectionLoader);
