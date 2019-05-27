import Widget from 'laboratory/widget';
import Shredder from 'xcraft-core-shredder';

export default (component, {format, parse} = {}) =>
  Widget.connect(
    (state, props) => {
      return Object.entries(props).reduce((properties, [key, path]) => {
        if (key === 'value') {
          const fieldState = state.get(`newForms.${path}`);
          if (!fieldState) {
            properties[key] = '';
          } else {
            const edit = fieldState.get('edit');
            if (edit) {
              const raw = fieldState.get('raw');
              properties[key] = raw;
            } else {
              let value = fieldState.get('value');
              if (format) {
                value = format(value);
              }
              properties[key] = value;
            }
          }
        } else {
          properties[key] = state.get(`newForms.${path}`);
        }

        return properties;
      }, {});
    },
    (dispatch, props) => {
      return {
        onFocus: e => {
          dispatch((d, getState) => {
            const fieldState = new Shredder(getState().newForms).get(
              props.value
            );
            let val = '';
            if (fieldState) {
              val = fieldState.get('value');
            }
            d({
              type: 'FIELD-FOCUS',
              path: props.value,
              value: format ? format(val) : val,
            });
          });
        },
        onBlur: e => {
          dispatch({
            type: 'FIELD-BLUR',
            path: props.value,
          });
          let res = e.target.value;
          if (parse) {
            res = parse(e.target.value);
          }

          dispatch({
            type: 'FIELD-CHANGED',
            path: props.value,
            value: res,
          });
        },
        onChange: e =>
          dispatch({
            type: 'FIELD-RAW-CHANGED',
            path: props.value,
            value: e.target.value,
          }),
      };
    }
  )(component);
