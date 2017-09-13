import React from 'react';
import {actions, Form as RFForm, Fieldset} from 'react-redux-form/immutable';
import Widget from 'laboratory/widget';
import importer from '../importer/';
const partialImporter = importer ('partial');

class Form extends Widget {
  constructor () {
    super (...arguments);
    this.getFormFieldValue = this.getFormFieldValue.bind (this);
  }

  setModelValue (path, value, useEntity) {
    let fullPath = 'backend.' + this.props.id + path;
    if (useEntity) {
      fullPath = 'backend.' + this.props.entityId + path;
    }
    this.props.dispatch (actions.change (fullPath, value));
  }

  setFormValue (path, value) {
    this.setModelValue (path, value);
  }

  setEntityValue (path, value) {
    this.setModelValue (path, value, true);
  }

  formFocus (model) {
    this.props.dispatch (actions.focus (model));
  }

  getPartial (name, props) {
    const Partial = partialImporter (name).bind (this);
    return <Partial {...props} />;
  }

  submit () {
    const value = this.formValue;
    this.do ('submit', {value});
  }

  getFormFieldValue (name) {
    const form = this.formValue;
    const modelValue = this.getMyState ().get (name);
    if (form[name]) {
      if (form[name].value) {
        return form[name].value;
      } else {
        return modelValue;
      }
    }
    return modelValue;
  }

  get formValue () {
    return this.getState ().forms.backend[this.props.id];
  }

  get Form () {
    return RFForm;
  }

  get Fieldset () {
    return Fieldset;
  }

  get formConfig () {
    const style = {
      display: 'flex',
      flexDirection: 'column',
    };
    return {
      component: 'div',
      validateOn: 'submit',
      model: `backend.${this.props.id}`,
      style,
    };
  }

  formConfigWithComponent (component) {
    const style = {
      display: 'flex',
      flexDirection: 'column',
    };
    return {
      component: component,
      validateOn: 'submit',
      model: `backend.${this.props.id}`,
      style,
    };
  }

  track (path, id) {
    //TODO: better immutable tracking
    //RRF track not working...
    const style = {
      display: 'flex',
      flexDirection: 'column',
    };
    return {
      component: 'div',
      model: `${path}.${id}`,
      style,
    };
  }

  render () {
    return <div>Missing widget implementation</div>;
  }
}

export default Form;
