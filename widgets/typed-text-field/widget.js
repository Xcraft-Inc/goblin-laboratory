import TextInput from 'laboratory/text-input/widget';
import fieldBinder from '../field-binder/widget.js';
import {date as DateConverters} from 'xcraft-core-converters';

const parse = raw => {
  return DateConverters.parseEdited(raw || '').value;
};

const format = canonical => {
  return DateConverters.getDisplayed(canonical || '');
};

export default fieldBinder(TextInput, {parse, format});
