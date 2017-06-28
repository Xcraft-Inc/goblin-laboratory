import React from 'react';
import {actions, LocalForm} from 'react-redux-form';
import _ from 'lodash';
import Widget from 'laboratory/widget';

class Form extends Widget {
  constructor (props) {
    super (props);
  }

  attachDispatch (dispatch) {
    this.formDispatch = dispatch;
  }

  formFocus () {
    if (this.formDispatch) {
      this.formDispatch (actions.focus (this.props.model));
    }
  }

  attachFormDispatch (formDispatch) {
    this.formDispatch = formDispatch;
  }

  handleFormSubmit (values) {
    this.do ('submit', values);
  }

  debounceUpdates (func) {
    return _.debounce (func, 500);
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
    }

    const form = this._forms[model];
    if (!form.value) {
      form.value = data.$form.initialValue;
      /* we can leave this round */
      return;
    }

    const modelValues = this.extractModelValues (data);
    if (modelValues) {
      if (JSON.stringify (modelValues) !== JSON.stringify (form.value)) {
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
      const {initialState} = props;
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
          getDispatch={dispatch => this.attachDispatch (dispatch)}
          initialState={initialState}
        >
          {props.children}
        </LocalForm>
      );
    };
  }

  render () {
    return <div>Missing widget implementation</div>;
  }
}

export default Form;