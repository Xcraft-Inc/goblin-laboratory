import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import Mousetrap from 'mousetrap';
import * as styles from './styles.js';

class QuakeNC extends Widget {
  constructor() {
    super(...arguments);
    this.styles = styles;
    this.inputRef = React.createRef();

    this.state = {
      show: false,
    };
  }

  componentDidMount() {
    Mousetrap.bind('f12', this.toggleConsole);
  }

  componentWillUnmount() {
    Mousetrap.unbind('f12');
  }

  toggleConsole = () => {
    this.setState({show: !this.state.show});
  };

  sendCommand = (prompt, command) => {
    this.doFor(this.props.labId, 'sendCommand', {prompt, command});
  };

  setCliFocus = () => {
    setTimeout(() => this.inputRef.current?.focus());
  };

  handleKeyDown = (event) => {
    if (event.key === 'Enter' && this.inputRef.current) {
      const {value} = this.inputRef.current;
      const prompt = '~ $';
      this.sendCommand(prompt, value);
      this.inputRef.current.value = '';
    }
    if (event.key === 'F12') {
      event.preventDefault();
      this.toggleConsole();
    }
  };

  renderCli() {
    const {busy} = this.props;
    return (
      <div className="cli">
        {busy ? null : (
          <>
            <span>~ $&nbsp;</span>
            <input
              className="input"
              type="text"
              onKeyDown={this.handleKeyDown}
              autoFocus
              ref={this.inputRef}
            ></input>
          </>
        )}
      </div>
    );
  }

  renderHistory() {
    return (
      <div className="history" onMouseDown={this.setCliFocus}>
        {this.props.history.reverse().map((row, index) => (
          <span key={index}>
            {row}
            <br />
            &nbsp;
          </span>
        ))}
      </div>
    );
  }

  renderConsole() {
    const {show} = this.state;
    return (
      <div className={this.styles.classNames.console} data-show={show}>
        {this.renderHistory()}
        {show ? this.renderCli() : null}
      </div>
    );
  }

  render() {
    const {children} = this.props;
    return (
      <>
        {children}
        {this.renderConsole()}
      </>
    );
  }
}

const Quake = Widget.connect((state, props) => {
  const labState = state.get('backend').get(props.labId);
  if (!labState) {
    return {labId: props.labId, history: [], busy: true};
  }

  return {
    labId: props.labId,
    history: labState.get('console.history'),
    busy: labState.get('console.busy'),
  };
})(QuakeNC);

export default Quake;
