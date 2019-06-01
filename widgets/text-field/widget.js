import TextInput from 'laboratory/text-input/widget';
import propsBinder from '../props-binder/widget.js';
// import fieldBinder from '../field-binder/widget.js';
import bindInput from '../input-binder/widget.js';
import wrapRawInput from '../input-wrapper/widget.js';

// const TextField = propsBinder(fieldBinder(TextInput));
const TextField = propsBinder(bindInput(wrapRawInput(TextInput)));
TextField.displayName = 'TextField';
export default TextField;
