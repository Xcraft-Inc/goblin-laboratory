import React from 'react';
import Widget from 'laboratory/widget';

export default class TextInput extends Widget {
  constructor() {
    super(...arguments);
  }

  render() {
    const {onChange, kind, ...other} = this.props;
    const className = this.styles.classNames.base;
    switch (kind) {
      case 'password':
        return (
          <input
            className={className}
            type="password"
            onChange={onChange}
            {...other}
          />
        );
      case 'multiline':
        return (
          <textarea className={className} onChange={onChange} {...other} />
        );
      case 'text':
      default:
        return <input className={className} onChange={onChange} {...other} />;
    }
  }
}
