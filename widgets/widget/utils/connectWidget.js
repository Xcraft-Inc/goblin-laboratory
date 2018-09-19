import connect from './connect';
import wrapMapStateToProps from './wrapMapStateToProps';

function withWidgetPath(mapStateToProps) {
  mapStateToProps = wrapMapStateToProps(mapStateToProps);
  return (state, ownProps) => {
    return mapStateToProps(state.get(`widgets.${ownProps.id}`), ownProps);
  };
}

export default function(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
  options
) {
  return connect(
    withWidgetPath(mapStateToProps),
    mapDispatchToProps,
    mergeProps,
    options
  );
}
