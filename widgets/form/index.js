import React from 'react';
import {actions} from 'react-redux-form/immutable';
import {Form as RFForm} from 'react-redux-form/immutable';
import Widget from 'laboratory/widget';

class Form extends Widget {
  constructor (props) {
    super (props);
  }

  setModel (model, value) {
    this.props.dispatch (actions.change (this.props.id + model, value));
  }

  formFocus (model) {
    this.props.dispatch (actions.focus (model));
  }

  get Form () {
    return RFForm;
  }

  get formConfig () {
    return {component: 'div', model: `models.${this.props.id}`};
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
