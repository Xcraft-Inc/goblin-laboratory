import React from 'react';
import {actions, LocalForm} from 'react-redux-form';
import _ from 'lodash';
import Widget from 'laboratory/widget';
import fasterStringify from 'faster-stable-stringify';

class Form extends Widget {
  constructor (props) {
    super (props);
    this._forms = {};
    this._focused = {};
  }

  attachDispatch (dispatch) {
    this.formDispatch = dispatch;
  }

  formFocus (model) {
    if (this.formDispatch) {
      this.formDispatch (actions.focus (model));
    }
  }

  attachFormDispatch (formDispatch) {
    this.formDispatch = formDispatch;
  }

  handleFormSubmit (values) {
    this.do ('submit', values);
  }

  debounceUpdates (func) {
    return _.debounce (func, 50);
  }

  handleFormUpdates (model, data) {
    if (!model) {
      return;
    }

    if (data.$form.model !== model) {
      return;
    }

    if (!this._forms[model]) {
      this._forms[model] = {};
      this._focused[model] = null;
    }

    const focused = this.extractFocus (data);
    if (focused) {
      this._focused[model] = focused;
    }

    const form = this._forms[model];
    if (!form.value) {
      form.value = Object.assign ({}, data.$form.initialValue);
      /* we can leave this round */
      return;
    }

    const modelValues = this.extractModelValues (data);
    if (modelValues) {
      if (fasterStringify (modelValues) !== fasterStringify (form.value)) {
        for (const fieldName in modelValues) {
          if (form.value[fieldName] !== modelValues[fieldName]) {
            form.value[fieldName] = modelValues[fieldName];
            const call = fieldName.replace (
              /([A-Z])/g,
              g => `-${g[0].toLowerCase ()}`
            );
            this.do (`change-${call}`, {newValue: modelValues[fieldName]});
          }
        }
      }
    }
  }

  extractFocus (data) {
    for (const fieldName in data) {
      if (fieldName !== '$form') {
        const field = data[fieldName];
        if (field.focus) {
          return fieldName;
        }
      }
    }
    return null;
  }

  extractModelValues (data) {
    let map = null;
    for (const fieldName in data) {
      if (fieldName !== '$form') {
        const field = data[fieldName];
        if (field.valid) {
          if (!map) {
            map = {};
          }
          map[fieldName] = field.value;
        }
      }
    }
    return map;
  }

  getForm (id) {
    return props => {
      const {initialState, focused} = props;
      if (!id) {
        return null;
      }

      const handleUpdate = values => {
        this.handleFormUpdates (id, values);
      };
      const onUpdate = this.debounceUpdates (handleUpdate);
      return (
        <LocalForm
          model={id}
          onUpdate={onUpdate}
          getDispatch={dispatch => {
            this.attachDispatch (dispatch);
            if (focused) {
              this.formFocus (`${id}.${focused}`);
            }
          }}
          initialState={initialState}
        >
          {props.children}
        </LocalForm>
      );
    };
  }

  componentWillUnmount () {
    Object.keys (this._forms).forEach (id => {
      const service = id.split ('@')[0];
      this.cmd (`${service}.save-form`, {
        id,
        value: this._forms[id].value,
        focused: this._focused[id],
      });
    });
  }

  render () {
    return <div>Missing widget implementation</div>;
  }
}

export default Form;
