import React from 'react';
import Widget from 'laboratory/widget';
import TextInput from 'laboratory/text-input/widget';
import fieldBinder from '../field-binder/widget.js';
import propsBinder from '../props-binder/widget.js';

const Field = propsBinder(fieldBinder(TextInput));
class CheckboxField extends Widget {
  constructor() {
    super(...arguments);
    this.parse = this.parse.bind(this);
    this.format = this.format.bind(this);
  }

  parse(raw) {
    if (typeof raw === 'string') {
      return raw === 'true' ? true : false;
    } else {
      return raw;
    }
  }

  format(canonical) {
    return canonical;
  }

  render() {
    return (
      <Field
        kind="$checkbox"
        parse={this.parse}
        format={this.format}
        model={this.context.model}
        value={this.props.value}
      />
    );
  }
}
export default CheckboxField;
