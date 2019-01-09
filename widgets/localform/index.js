'use strict';
import Form from 'laboratory/form';
import React from 'react';

class LocalForm extends Form {
  constructor() {
    super(...arguments);
  }

  render() {
    const Form = this.Form;
    return (
      <Form {...this.formConfigWithComponent(() => this.props.children)} />
    );
  }
}

export default LocalForm;
