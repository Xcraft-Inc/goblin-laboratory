import React from 'react';
import connect from './connect';
import wrapMapStateToProps from './wrapMapStateToProps';

function withBackendPath(mapStateToProps) {
  mapStateToProps = wrapMapStateToProps(mapStateToProps);
  return (state, ownProps) => {
    if (!ownProps.id) {
      return {
        _loading: true,
      };
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
  return Comp =>
    connect(
      withBackendPath(mapStateToProps),
      mapDispatchToProps,
      mergeProps,
      options
    )(props => {
      if (props._loading) {
        if (Comp.LoadingComponent) {
          return <Comp.LoadingComponent />;
        } else {
          return <div>loading</div>;
        }
      } else {
        return <Comp {...props} />;
      }
    });
}
