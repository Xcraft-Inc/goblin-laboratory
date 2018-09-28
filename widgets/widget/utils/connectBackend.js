import React from 'react';
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
    const backendState = state.get(`backend.${ownProps.id}`);
    if (!backendState) {
      return {
        _loading: true,
      };
    }
    return mapStateToProps(backendState, ownProps);
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
          return null;
        }
      } else {
        return <Comp {...props} />;
      }
    });
}
