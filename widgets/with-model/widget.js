import PropTypes from 'prop-types';
import Widget from 'laboratory/widget';
import joinModels from '../connect-helpers/join-models';

export default class WithModel extends Widget {
  constructor() {
    super(...arguments);
  }

  getChildContext() {
    const model = joinModels(this.context.model, this.props.model);
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
