import React from 'react';
import {actions, Form as RFForm} from 'react-redux-form/immutable';
import Widget from 'laboratory/widget';

class Form extends Widget {
  constructor () {
    super (...arguments);
  }

  setModel (path, value) {
    this.props.dispatch (actions.change (this.props.id + path, value));
  }

  formFocus (model) {
    this.props.dispatch (actions.focus (model));
  }

  get Form () {
    return RFForm;
  }

  get formConfig () {
    const style = {
      display: 'flex',
      flexDirection: 'column',
    };
    return {component: 'div', model: `models.${this.props.id}`, style};
  }

  render () {
    return <div>Missing widget implementation</div>;
  }
}

export default Form;
