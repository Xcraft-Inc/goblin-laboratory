import React from 'react';
import Widget from 'laboratory/widget';

export default class TextInput extends Widget {
  constructor() {
    super(...arguments);
  }

  render() {
    const {onChange, parse, format, model, kind, ...other} = this.props;
    const className = this.styles.classNames.base;
    switch (kind) {
      case 'password':
        return (
          <input
            className={className}
            {...other}
            type="password"
            onChange={onChange}
          />
        );
      case 'multiline':
        return (
          <textarea {...other} className={className} onChange={onChange} />
        );
      case 'text':
      default:
        return (
          <input
            {...other}
            className={className}
            onChange={onChange}
            type="text"
          />
        );
    }
  }
}
