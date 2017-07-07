import React from 'react';
import Widget from 'laboratory/widget';
import {LocalForm as Form} from 'react-redux-form';
class LocalForm extends Widget {
  constructor (props) {
    super (props);
  }

  static get wiring () {
    return {
      id: 'id',
      workitemId: 'workitemId',
      value: 'value',
      focused: 'focused',
    };
  }

  render () {
    const {
      id,
      workitemId,
      value,
      focused,
      handleFormUpdates,
      debounceUpdates,
      attachDispatch,
      formFocus,
    } = this.props;

    if (!id) {
      return null;
    }

    if (!workitemId) {
      return null;
    }

    const handleUpdate = values => {
      handleFormUpdates (workitemId, values);
    };
    const onUpdate = debounceUpdates (handleUpdate);
    return (
      <Form
        model={workitemId}
        onUpdate={onUpdate}
        getDispatch={dispatch => {
          attachDispatch (dispatch);
          if (focused) {
            formFocus (`${workitemId}.${focused}`);
          }
        }}
        initialState={value.toJS ()}
      >
        {this.props.children}
      </Form>
    );
  }
}

export default LocalForm;
