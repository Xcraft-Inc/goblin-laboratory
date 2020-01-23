import toCss from 'obj-to-css';
import cssKey from 'css-key';

export default function jsToCSS(jsStyles) {
  return toCss(
    Object.assign(
      {},
      ...Object.keys(jsStyles).map(className => {
        return {
          [cssKey(className)]: Object.assign(
            {},
            ...Object.keys(jsStyles[className]).map(key => {
              return {[cssKey(key)]: jsStyles[className][key]};
            })
          ),
        };
      })
    )
  );
}
