import React from 'react';
import Widget from 'laboratory/widget';
import TextInput from 'laboratory/text-input/widget';
import propsBinder from '../props-binder/widget.js';
import bindInput from '../input-binder/widget.js';
import wrapRawInput from '../input-wrapper/widget.js';
import converters from 'xcraft-core-converters';

const TextField = bindInput(wrapRawInput(TextInput));

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
      <TextField
        parse={this.parse}
        format={this.format}
        kind="text"
        value={this.props.value}
      />
    );
  }
}

export default propsBinder(TypedTextField);
