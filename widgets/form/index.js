import React from 'react';
import {
  actions,
  track,
  Form as RFForm,
  Fieldset,
} from 'react-redux-form/immutable';
import Widget from 'laboratory/widget';
import importer from '../importer/';
const partialImporter = importer ('partial');

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

  getPartial (name, props) {
    const Partial = partialImporter (name).bind (this);
    return <Partial {...props} />;
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
    return {component: 'div', model: `backend.${this.props.id}`, style};
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
