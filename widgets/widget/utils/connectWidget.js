import connect from './connect';
import wrapMapStateToProps from './wrapMapStateToProps';

function withWidgetPath(mapStateToProps) {
  mapStateToProps = wrapMapStateToProps(mapStateToProps);
  return (state, ownProps) => {
    const widgetId = ownProps.widgetId || ownProps.id;
    if (!widgetId) {
      throw new Error(
        'Cannot connect widget state without an id. You must add a prop "widgetId" or "id" to the connected component'
      );
    }
    return mapStateToProps(state.get(`widgets.${widgetId}`), ownProps);
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
