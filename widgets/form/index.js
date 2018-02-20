import React from 'react';
import PropTypes from 'prop-types';

import {actions, Form as RFForm, Fieldset} from 'react-redux-form/immutable';
import Widget from 'laboratory/widget';
import importer from '../importer/';
import ReactList from 'react-list';
const partialImporter = importer('partial');

class Form extends Widget {
  constructor() {
    super(...arguments);
    this.getFormFieldValue = this.getFormFieldValue.bind(this);
  }

  formFocus(model) {
    this.props.dispatch(actions.focus(model));
  }

  getPartial(name, props) {
    const Partial = partialImporter(name).bind(this);
    return <Partial {...props} />;
  }

  submitAs(service) {
    const value = this.formValue;
    this.doAs(service, 'submit', {value});
  }

  submit() {
    const value = this.formValue;
    this.do('submit', {value});
  }

  getFormFieldValue(name) {
    const form = this.formValue;
    const modelValue = this.getMyState().get(name);
    if (form[name]) {
      if (form[name].value) {
        return form[name].value;
      } else {
        return modelValue;
      }
    }
    return modelValue;
  }

  getList(item, type, length) {
    return props => (
      <ReactList length={length} type={type} itemRenderer={item} {...props} />
    );
  }

  get formValue() {
    return this.getState().forms.backend[this.props.id];
  }

  get Form() {
    return RFForm;
  }

  get Fieldset() {
    return Fieldset;
  }

  get formConfig() {
    const style = {
      display: 'flex',
      flexDirection: 'column',
    };
    const id = this.props.id ? this.props.id : this.context.id;
    return {
      component: 'div',
      validateOn: 'submit',
      model: `backend.${id}`,
      style,
    };
  }

  get entityConfig() {
    const style = {
      display: 'flex',
      flexDirection: 'column',
    };
    return {
      component: 'div',
      validateOn: 'submit',
      model: `backend.${this.props.entityId}`,
      style,
    };
  }

  formConfigWithComponent(component) {
    const style = {
      display: 'flex',
      flexDirection: 'column',
    };
    const id = this.props.id ? this.props.id : this.context.id;
    return {
      component: component,
      validateOn: 'submit',
      model: `backend.${id}`,
      style,
    };
  }

  componentWillUnmount() {
    //Garbage form model
    const dispatch = this.props.dispatch
      ? this.props.dispatch
      : this.context.dispatch;
    const id = this.props.id ? this.props.id : this.context.id;
    setTimeout(() => {
      const state = this.getState();
      const modelData = state.backend.get(id, 'removed');
      if (modelData === 'removed') {
        if (state.forms.backend[id]) {
          console.log('Garbage ', id);
          dispatch(
            actions.reset({
              getState: this.getState.bind(this),
            })
          );
        }
      }
    }, 1000);
  }

  track(path, id) {
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

  render() {
    return <div>Missing widget implementation</div>;
  }
}

export default Form;
