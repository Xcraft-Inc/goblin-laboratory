import Widget from 'laboratory/widget';
import Shredder from 'xcraft-core-shredder';

export default Widget.connect(
  (state, props) => {
    const {value, format, model} = props;
    if (!value) {
      throw new Error('No value props provided, field-binder failed');
    }
    //do binding
    let finalValue = '';
    let path = value;
    if (value.startsWith('.')) {
      path = `${model}${value}`;
    }

    const fieldState = state.get(`newForms.${path}`);
    if (fieldState) {
      const edit = fieldState.get('edit');
      if (edit) {
        const raw = fieldState.get('raw');
        finalValue = raw;
      } else {
        let value = fieldState.get('value');
        if (format) {
          value = format(value);
        }
        finalValue = value;
      }
    }

    return {value: finalValue};
  },
  (dispatch, props) => {
    const {parse, format, model} = props;
    let path = props.value;

    if (!path) {
      return {};
    }

    if (path.startsWith('.')) {
      path = `${model}${path}`;
    }

    return {
      onFocus: () => {
        dispatch((d, getState) => {
          const fieldState = new Shredder(getState().newForms).get(path);
          let val = '';
          if (fieldState) {
            val = fieldState.get('value');
          }
          d({
            type: 'FIELD-FOCUS',
            path,
            value: format ? format(val) : val,
          });
        });
      },
      onBlur: e => {
        dispatch({
          type: 'FIELD-BLUR',
          path,
        });
        let res = e.target.value;
        if (parse) {
          res = parse(e.target.value);
        }

        dispatch({
          type: 'FIELD-CHANGED',
          path,
          value: res,
        });
      },
      onChange: e =>
        dispatch({
          type: 'FIELD-RAW-CHANGED',
          path,
          value: e.target.value,
        }),
    };
  }
);
