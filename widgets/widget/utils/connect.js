//T:2019-02-27

import {connect} from 'react-redux';
import Shredder from 'xcraft-core-shredder';
import shallowEqualShredder from './shallowEqualShredder';
import wrapMapStateToProps from './wrapMapStateToProps';

function withShredder(mapStateToProps) {
  mapStateToProps = wrapMapStateToProps(mapStateToProps);

  const mapStateToPropsWithOwnProps = (state, ownProps) => {
    const s = new Shredder({
      backend: state.backend,
      widgets: state.widgets,
      newForms: state.newForms,
    });
    return mapStateToProps(s, ownProps);
  };

  const mapStateToPropsWithoutOwnProps = state => {
    return mapStateToPropsWithOwnProps(state);
  };

  return mapStateToProps.length > 1
    ? mapStateToPropsWithOwnProps
    : mapStateToPropsWithoutOwnProps;
}

export default function(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
  options
) {
  return connect(
    withShredder(mapStateToProps),
    mapDispatchToProps,
    mergeProps,
    {
      pure: true,
      areOwnPropsEqual: shallowEqualShredder,
      areStatePropsEqual: shallowEqualShredder,
      areMergedPropsEqual: shallowEqualShredder,
      ...options,
    }
  );
}
