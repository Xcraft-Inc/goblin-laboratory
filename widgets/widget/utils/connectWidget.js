import connect from './connect';
import wrapMapStateToProps from './wrapMapStateToProps';

function withWidgetPath(mapStateToProps) {
  mapStateToProps = wrapMapStateToProps(mapStateToProps);
  return (state, ownProps) => {
    if (!ownProps.id) {
      throw new Error(
        'Cannot connect widget state without an id. You must add a prop "id" to the connected component'
      );
    }
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
