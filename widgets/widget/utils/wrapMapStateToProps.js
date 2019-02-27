//T:2019-02-27

export default function wrapMapStateToProps(mapStateToProps) {
  if (
    typeof mapStateToProps === 'string' ||
    mapStateToProps instanceof String
  ) {
    return state => {
      return {
        [mapStateToProps]: state.get(mapStateToProps),
      };
    };
  }

  if (typeof mapStateToProps === 'object' && mapStateToProps !== null) {
    return state => {
      const props = {};
      Object.keys(mapStateToProps).forEach(key => {
        props[key] = state.get(mapStateToProps[key]);
      });
      return props;
    };
  }

  return mapStateToProps;
}
