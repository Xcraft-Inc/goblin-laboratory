import PropTypes from 'prop-types';
import Widget from 'laboratory/widget';

export default class WithModel extends Widget {
  constructor() {
    super(...arguments);
  }

  getChildContext() {
    let model = this.props.model;
    if (model.startsWith('.')) {
      const parentModel = this.context.model || '';
      model = `${parentModel}${model}`;
    }
    return {
      model,
    };
  }

  static get childContextTypes() {
    return {
      model: PropTypes.string,
    };
  }

  render() {
    return this.props.children;
  }
}
