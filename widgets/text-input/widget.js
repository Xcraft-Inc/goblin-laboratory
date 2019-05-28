import React from 'react';
import Widget from 'laboratory/widget';

export default class TextInput extends Widget {
  constructor() {
    super(...arguments);
  }

  render() {
    const {onChange, parse, format, model, kind, ...other} = this.props;
    let {value} = this.props;
    if (value === null) {
      value = ''; // Ensure <input/> is always "controlled"
    }
    const className = this.styles.classNames.base;
    switch (kind) {
      case 'checkbox':
        return (
          <input
            {...other}
            className={className}
            type="checkbox"
            onChange={onChange}
            value={value}
          />
        );
      case 'password':
        return (
          <input
            {...other}
            className={className}
            type="password"
            onChange={onChange}
            value={value}
          />
        );
      case 'multiline':
        return (
          <textarea
            {...other}
            className={className}
            onChange={onChange}
            value={value}
          />
        );
      case 'text':
      default:
        return (
          <input
            {...other}
            type="text"
            className={className}
            onChange={onChange}
            value={value}
          />
        );
    }
  }
}
