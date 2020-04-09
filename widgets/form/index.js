//T:2019-02-27
import React from 'react';

import Widget from 'goblin-laboratory/widgets/widget';
import WithModel from '../with-model/widget';

/******************************************************************************/

// TODO: Adapt code that use it and remove it
const FormComponent = (props) => {
  const {
    component: Component,
    model,
    children,
    validateOn,
    ...otherProps
  } = props;
  return (
    <WithModel model={model}>
      <Component {...otherProps}>{children}</Component>
    </WithModel>
  );
};

/******************************************************************************/

class Form extends Widget {
  constructor() {
    super(...arguments);
  }

  get Form() {
    return FormComponent;
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

  get formConfigWithoutStyle() {
    const id = this.props.id ? this.props.id : this.context.id;
    return {
      component: 'div',
      validateOn: 'submit',
      model: `backend.${id}`,
    };
  }

  formConfigWithComponent(component) {
    // FIXME: use aphrodite
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

  render() {
    return <div>Missing widget implementation</div>;
  }
}

export default Form;
