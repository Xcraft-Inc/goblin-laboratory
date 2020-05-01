import PropTypes from 'prop-types';
import Widget from 'goblin-laboratory/widgets/widget';

export default class WithDesktopId extends Widget {
  getChildContext() {
    return {
      desktopId: this.props.desktopId,
    };
  }

  static get childContextTypes() {
    return {
      desktopId: PropTypes.string,
    };
  }

  render() {
    return this.props.children;
  }
}
