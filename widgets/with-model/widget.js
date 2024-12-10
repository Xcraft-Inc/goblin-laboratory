import React from 'react';
import PropTypes from 'prop-types';
import Widget from 'goblin-laboratory/widgets/widget';
import joinModels from '../connect-helpers/join-models';
import ModelContext from './context';
import withC from '../connect-helpers/with-c.js';

class WithModelNC extends Widget {
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
    return (
      <ModelContext.Consumer>
        {(modelContext) => {
          const model = joinModels(
            modelContext || this.context.model,
            this.props.model
          );
          return (
            <ModelContext.Provider value={model}>
              {this.props.children}
            </ModelContext.Provider>
          );
        }}
      </ModelContext.Consumer>
    );
  }
}

const WithModel = withC(WithModelNC);

export default WithModel;
