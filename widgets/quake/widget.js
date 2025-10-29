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

  sendCommand = (prompt, name) => {
    this.doFor('termux', 'beginCommand', {prompt, name});
  };

  setCliFocus = () => {
    setTimeout(() => this.inputRef.current?.focus());
  };

  handleKeyDown = (event) => {
    switch (event.key) {
      case 'Enter': {
        if (!this.inputRef.current) {
          break;
        }
        const {value} = this.inputRef.current;
        const prompt = '~ $';
        this.sendCommand(prompt, value);
        this.inputRef.current.value = '';
        break;
      }
      case 'F12': {
        event.preventDefault();
        this.toggleConsole();
        break;
      }
      case 'Tab': {
        event.preventDefault();
        break;
      }
    }
  };

  renderCli() {
    const {busy} = this.props;
    return (
      <div className="cli">
        {busy ? (
          <span>&nbsp;</span>
        ) : (
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
            {row.split('\n').map((row) => (
              <>
                {row}
                <br />
              </>
            ))}
          </span>
        ))}
      </div>
    );
  }

  renderConsole() {
    return (
      <>
        {this.renderHistory()}
        {this.renderCli()}
      </>
    );
  }

  render() {
    const {children} = this.props;
    const {show} = this.state;
    return (
      <>
        {children}
        <div className={this.styles.classNames.console} data-show={show}>
          {show ? this.renderConsole() : null}
        </div>
      </>
    );
  }
}

const Quake = Widget.connect((state, props) => {
  const termux = state.get('backend').get('termux');
  if (!termux) {
    return {busy: true, history: []};
  }

  return {
    busy: termux.get('busy', false),
    history: termux.get('history', []),
  };
})(QuakeNC);

export default Quake;
