import React from 'react';
import Widget from 'laboratory/widget';
import TextInput from 'laboratory/text-input/widget';
import fieldBinder from '../field-binder/widget.js';
import propsBinder from '../props-binder/widget.js';
import converters from 'xcraft-core-converters';

const Field = fieldBinder(TextInput);
class TypedTextField extends Widget {
  constructor() {
    super(...arguments);
    this.format = this.format.bind(this);
    this.parse = this.parse.bind(this);
  }

  get list() {
    return Object.keys(converters);
  }

  format(canonical) {
    const {type} = this.props;
    const converter = converters[type];
    if (converter) {
      let displayed = '';
      try {
        displayed = converter.getDisplayed(canonical || '');
      } catch (err) {
        displayed = 'err';
      }
      return displayed;
    } else {
      return canonical;
    }
  }

  parse(raw) {
    const {type} = this.props;
    const converter = converters[type];
    if (converter) {
      return converter.parseEdited(raw || '').value;
    } else {
      return raw;
    }
  }

  componentWillMount() {
    const {type} = this.props;
    if (!type || !converters[type]) {
      console.warn(
        `TypedTextField: ${
          type
            ? `unsupported ${type} converter, exisiting: ${this.list}`
            : 'no type props provided'
        }`
      );
    }
  }

  render() {
    return (
      <Field
        model={this.context.model}
        parse={this.parse}
        format={this.format}
        kind="$text"
        value={this.props.value}
      />
    );
  }
}
const BindableTypedTextField = propsBinder(TypedTextField);
class ModelProvider extends Widget {
  constructor() {
    super(...arguments);
  }

  render() {
    return (
      <BindableTypedTextField model={this.context.model} {...this.props} />
    );
  }
}

export default ModelProvider;
