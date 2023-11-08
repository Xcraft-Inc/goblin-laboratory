import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import * as styles from './styles.js';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faExclamationTriangle, faRedo} from '@fortawesome/free-solid-svg-icons';

export default class ErrorHandler extends Widget {
  constructor() {
    super(...arguments);
    this.styles = styles;
    this.state = {error: null};
    this.renderError = this.renderError.bind(this);
    this.rerender = this.rerender.bind(this);
  }

  static getDerivedStateFromError(error) {
    return {error};
  }

  rerender() {
    this.setState({error: null});
  }

  renderError(error) {
    return (
      <div
        className={this.styles.classNames.errorHandler}
        data-big={this.props.big}
      >
        <div className="icons" title={error.stack} onClick={this.rerender}>
          <FontAwesomeIcon icon={faExclamationTriangle} className="icon" />
          <FontAwesomeIcon icon={faRedo} className="hover-icon" />
        </div>
      </div>
    );
  }

  render() {
    if (this.state.error) {
      const {renderError = this.renderError} = this.props;
      return renderError(this.state.error);
    }
    return this.props.children;
  }
}
