import connect from './connect';
import wrapMapStateToProps from './wrapMapStateToProps';

function withBackendPath(mapStateToProps) {
  mapStateToProps = wrapMapStateToProps(mapStateToProps);
  return (state, ownProps) => {
    if (!ownProps.id) {
      throw new Error(
        'Cannot connect backend state without an id. You must add a prop "id" to the connected component'
      );
    }
    return mapStateToProps(state.get(`backend.${ownProps.id}`), ownProps);
  };
}

export default function(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
  options
) {
  return connect(
    withBackendPath(mapStateToProps),
    mapDispatchToProps,
    mergeProps,
    options
  );
}
