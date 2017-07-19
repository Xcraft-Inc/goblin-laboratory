import React from 'react';
import {actions} from 'react-redux-form/immutable';
import LocalForm from './local-form';
import Widget from 'laboratory/widget';

class Form extends Widget {
  constructor (props, context) {
    super (props);
  }

  setModel (model, value) {
    this.props.dispatch (actions.change (this.props.id + model, value));
  }

  formFocus (model) {
    this.props.dispatch (actions.focus (model));
  }

  getForm (id) {
    if (!id) {
      return null;
    }

    return Widget.Wired (LocalForm) (`form@${id}`);
  }

  componentWillUnmount () {
    /*Object.keys (this._forms).forEach (id => {
      this.cmd (`form.save-form`, {
        id: `form@${id}`,
        value: this._forms[id].value,
        focused: this._focused[id],
      });
    });*/
  }

  render () {
    return <div>Missing widget implementation</div>;
  }
}

export default Form;
