import React from 'react';
import ReactList from 'react-list';
import Widget from 'laboratory/widget';
import {Field} from 'redux-form';

class Form extends Widget {
  constructor (props) {
    super (props);
  }

  get field () {
    return props => {
      const {type, name, component} = props;
      return <Field name={name} type={type} component={component} />;
    };
  }

  get isForm () {
    return true;
  }

  widget () {
    return <div>Missing widget implementation</div>;
  }
}

export default Form;
