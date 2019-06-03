import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';

/**
 * Binds an input component to the backend or frontend
 *
 * The new component takes:
 * * prop/context model (example: 'backend.customer@111' or 'widgets.order@222$form')
 * * prop value (example: '.name')
 *
 * And gives the following props to the underlying input component:
 * * 'value' binded to the backend or frontend state.
 * * 'onChange', dispatch a backend quest 'change' or frontend action 'CHANGE'.
 *
 * @param {Component} Component - The input to bind
 * @returns {Component} A new component
 */
export default function bindInput(Component) {
  const ConnectedComponent = Widget.connect(
    (state, props) => {
      if (!state.has(props._rootId)) {
        return {
          loading: true,
          value: undefined,
        };
      }
      // Replace 'value' which is a path in the state by the real value at this path.
      return {
        value: state.get(props.value),
      };
    },
    () => ({}), // Do not add "dispatch" to the props
    (stateProps, dispatchProps, ownProps) => {
      const {_rootId, ...otherProps} = ownProps;
      return {
        ...otherProps,
        ...stateProps,
        ...dispatchProps,
      };
    }
  )(Component);

  return class InputBinder extends Widget {
    constructor() {
      super(...arguments);
      this.handleChange = this.handleChange.bind(this);

      if (this.context.register) {
        this.context.register(this.props.value);
      }
    }

    handleChange(value) {
      // Dispatch backend quest or frontend action
      const [root, id, ...pathArray] = this.valuePath.split('.');
      const path = pathArray.join('.');
      if (root === 'backend') {
        // If the 'change' quest is called here, it doesn't compensate and
        // the value displayed in the input flickers.
        // this.doFor(id, 'change', {
        //   path,
        //   newValue: value,
        // });
        this.rawDispatch({
          type: 'FIELD-CHANGED',
          path: this.valuePath,
          value,
        });
      } else if (root === 'widgets') {
        this.dispatchTo(id, {
          type: 'CHANGE',
          path,
          newValue: value,
        });
      } else {
        throw new Error(`Model path starting with '${root}' is not supported.`);
      }
    }

    render() {
      if (!this.props.value) {
        throw new Error(
          'No "value" prop provided. You must add a prop "value" to the component connected by "input-binder".'
        );
      }
      // Merge model and value path
      this.valuePath = this.props.value;
      if (this.valuePath.startsWith('.')) {
        const model = this.props.model || this.context.model;
        this.valuePath = `${model}${this.valuePath}`;
      } else if (this.valuePath.startsWith('state.')) {
        this.valuePath = this.valuePath.substring(6);
      }

      const [root, id] = this.valuePath.split('.');

      return (
        <ConnectedComponent
          {...this.props}
          onChange={this.handleChange}
          value={this.valuePath}
          _rootId={`${root}.${id}`}
        />
      );
    }
  };
}
