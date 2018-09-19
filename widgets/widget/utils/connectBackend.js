import connect from './connect';
import wrapMapStateToProps from './wrapMapStateToProps';

function withBackendPath(mapStateToProps) {
  mapStateToProps = wrapMapStateToProps(mapStateToProps);
  return (state, ownProps) => {
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
