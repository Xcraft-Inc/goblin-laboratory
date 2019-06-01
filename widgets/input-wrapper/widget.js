import React from 'react';
import Widget from 'laboratory/widget';

/**
 * Wraps a raw input.
 *
 * @param {Component} Component - The raw input to wrap
 * @returns {Component} A new component
 */
export default function wrapRawInput(Component) {
  /**
   * InputWrapper memorises the raw (text) value displayed in the input and
   * only exposes the canonical value, that can be any JS value.
   * The canonical value changes less frequently. Usually only on input blur.
   *
   * props:
   * `value`: the canonical value.
   * `onChange`: function called by the component to change the canonical value.
   * `format`: (optional) function to transform the canonical value to the raw value to display in the input.
   * `parse`: (optionnel) function to transform the raw value to the canonical value.
   * other props are given to the underlying input.
   */
  return class InputWrapper extends Widget {
    constructor() {
      super(...arguments);
      this.handleChange = this.handleChange.bind(this);
      this.enterEditing = this.enterEditing.bind(this);
      this.leaveEditing = this.leaveEditing.bind(this);

      this.state = {
        edit: false,
        raw: undefined,
      };
    }

    handleChange(value) {
      this.setState({
        raw: value,
      });
      // TODO (configurable) apply props.parse and call props.onChange with debounce
    }

    enterEditing() {
      let raw = this.props.value;
      if (this.props.format) {
        raw = this.props.format(raw);
      }
      this.setState({
        raw,
        edit: true,
      });
    }

    leaveEditing() {
      let value = this.state.raw;
      if (this.props.parse) {
        value = this.props.parse(value);
      }
      this.props.onChange(value);
      this.setState({
        edit: false,
        raw: undefined,
      });
    }

    render() {
      let value;
      if (this.state.edit) {
        value = this.state.raw;
      } else {
        value = this.props.value;
        if (this.props.format) {
          value = this.props.format(value);
        }
      }
      return (
        <Component
          {...this.props}
          onChange={this.handleChange}
          onFocus={this.enterEditing}
          onBlur={this.leaveEditing}
          value={value}
        />
      );
    }
  };
}
