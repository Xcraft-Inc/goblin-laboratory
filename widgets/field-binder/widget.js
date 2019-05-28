import React from 'react';
import Widget from 'laboratory/widget';
import Shredder from 'xcraft-core-shredder';

const beforeConnect = ConnectedComponent => props => {
  const {value, model} = props;
  if (!value) {
    throw new Error(
      'No "value" prop provided. You must add a prop "value" to the component connected with "field-binder".'
    );
  }
  let newModel = value;
  if (value.startsWith('.')) {
    newModel = `${model}${value}`;
  }
  return <ConnectedComponent {...props} model={newModel} />;
};

const afterConnect = Component => props => {
  const {format, parse, _useFormat, ...other} = props;
  let {value} = props;
  if (_useFormat && format) {
    value = format(value);
  }
  return <Component {...other} value={value} />;
};

export default Component => {
  const ConnectedComponent = Widget.connect(
    (state, props) => {
      const {model} = props;

      const fieldState = state.get(`newForms.${model}`);
      if (fieldState) {
        const edit = fieldState.get('edit');
        if (edit) {
          return {value: fieldState.get('raw'), _useFormat: false};
        }
        if (model.startsWith('backend.') || model.startsWith('widgets.')) {
          return {value: state.get(model), _useFormat: true};
        }
        return {value: fieldState.get('value'), _useFormat: true};
      }

      return {value: '', _useFormat: false}; // FIXME: handle 'model' which starts with 'backend' or 'widgets'
    },
    (dispatch, props) => {
      const {parse, format, model} = props;

      return {
        onFocus: () => {
          dispatch((d, getState) => {
            const {backend, newForms, widgets} = getState();
            const state = new Shredder({backend, newForms, widgets});
            let value = '';
            if (model.startsWith('backend.') || model.startsWith('widgets.')) {
              value = state.get(model);
            } else {
              const fieldState = state.get(`newForms.${model}`);
              if (fieldState) {
                value = fieldState.get('value');
              }
            }

            d({
              type: 'FIELD-FOCUS',
              path: model,
              value: format ? format(value) : value,
            });
          });
        },
        onBlur: e => {
          dispatch({
            type: 'FIELD-BLUR',
            path: model,
          });

          let value = e.target.value;
          if (parse) {
            value = parse(value);
          }

          dispatch({
            type: 'FIELD-CHANGED',
            path: model,
            value,
          });
        },
        onChange: e =>
          dispatch({
            type: 'FIELD-RAW-CHANGED',
            path: model,
            value: e.target.value,
          }),
      };
    }
  )(afterConnect(Component));

  return beforeConnect(ConnectedComponent);
};
