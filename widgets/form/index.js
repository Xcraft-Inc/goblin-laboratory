import React from 'react';
import {actions, Form as RFForm} from 'react-redux-form/immutable';
import Widget from 'laboratory/widget';

class Form extends Widget {
  constructor () {
    super (...arguments);
  }

  setModel (model, value) {
    this.props.dispatch (actions.change (this.props.id + model, value));
  }

  formFocus (model) {
    this.props.dispatch (actions.focus (model));
  }

  loadForm () {
    const state = this.getState ();
    const model = state.models.get (this.props.id, null);
    if (!model) {
      console.log ('Loading form...');
      Object.keys (this.props).forEach (p => {
        if (p !== 'id' && typeof this.props[p] !== 'function') {
          this.props.dispatch (
            actions.load (`${this.props.id}.${p}`, this.props[p])
          );
        }
      });
    }
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

  componentWillMount () {
    this.loadForm ();
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
