import Widget from 'laboratory/widget';

export default Widget.connect((state, props) => {
  const {model, ...otherProps} = props;
  return Object.entries(otherProps).reduce((properties, [key, path]) => {
    if (key === 'value') {
      properties[key] = path;
      return properties;
    }

    if (typeof path !== 'string') {
      properties[key] = path;
      return properties;
    }

    if (path.startsWith('$')) {
      properties[key] = path.substring(1);
      return properties;
    }

    //do binding
    if (path.startsWith('.')) {
      path = `${model}${path}`;
    }

    properties[key] = state.get(`newForms.${path}.value`);
    return properties;
  }, {});
});
