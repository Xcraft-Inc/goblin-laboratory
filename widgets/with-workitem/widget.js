import PropTypes from 'prop-types';
import Widget from 'goblin-laboratory/widgets/widget';

export default class WithWorkitem extends Widget {
  constructor() {
    super(...arguments);
  }

  getChildContext() {
    return {
      readonly: this.props.readonly,
      id: this.props.id,
      entityId: this.props.entityId,
      dragServiceId: this.props.dragServiceId,
    };
  }

  static get childContextTypes() {
    return {
      readonly: PropTypes.any,
      id: PropTypes.string,
      entityId: PropTypes.string,
      dragServiceId: PropTypes.string,
    };
  }

  render() {
    return this.props.children;
  }
}
