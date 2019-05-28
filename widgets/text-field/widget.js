import React from 'react';
import Widget from 'laboratory/widget';
import TextInput from 'laboratory/text-input/widget';
import fieldBinder from '../field-binder/widget.js';
import propsBinder from '../props-binder/widget.js';

const Field = propsBinder(fieldBinder(TextInput));
class TextField extends Widget {
  constructor() {
    super(...arguments);
  }

  render() {
    return (
      <Field
        model={this.context.model}
        kind={this.props.kind}
        value={this.props.value}
      />
    );
  }
}
export default TextField;
