import React from 'react';
import Widget from 'laboratory/widget';
import {Form} from 'react-redux-form/immutable';
class LocalForm extends Widget {
  constructor (props) {
    super (props);
  }

  static get wiring () {
    return {
      id: 'id',
      workitemId: 'workitemId',
    };
  }

  render () {
    const {id, workitemId} = this.props;

    if (!id) {
      return null;
    }

    if (!workitemId) {
      return null;
    }

    const style = {
      display: 'flex',
      flexDirection: 'column',
    };

    return (
      <Form
        component="div"
        store={this.context.store}
        model={`workitems.${workitemId}`}
        style={style}
      >
        {this.props.children}
      </Form>
    );
  }
}

export default LocalForm;
