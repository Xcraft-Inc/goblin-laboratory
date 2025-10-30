import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import Mousetrap from 'mousetrap';
import * as styles from './styles.js';

class TermuxNC extends Widget {
  scrollTimeout;

  constructor() {
    super(...arguments);
    this.styles = styles;
    this.inputRef = React.createRef();

    this.state = {
      show: false,
      value: '',
    };
  }

  scrollToBottom() {
    if (this.inputRef.current) {
      this.inputRef.current.scrollIntoView();
    }
  }

  componentDidMount() {
    Mousetrap.bind('alt+f12', this.toggleConsole);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    Mousetrap.unbind('alt+f12');
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }

  componentDidUpdate(prevProps) {
    const {completion} = this.props;
    if (completion && prevProps.completion !== completion) {
      this.setState({
        value: completion === '<empty>' ? '' : this.props.completion + ' ',
      });
      this.clearCompletion();
    }
  }

  toggleConsole = () => {
    this.setState({show: !this.state.show});
  };

  askForCompletion = (prompt) => {
    const input = this.inputRef.current?.value;
    this.doFor('termux', 'askForCompletion', {prompt, input});
  };

  setFromHistory = (up) => {
    const input = this.inputRef.current?.value;
    this.doFor('termux', 'setFromHistory', {up, input});
  };

  clearCompletion = () => {
    this.doFor('termux', 'clearCompletion');
  };

  sendCommand = (prompt, name, params) => {
    this.doFor('termux', 'beginCommand', {prompt, name, params});
  };

  setCliFocus = () => {
    setTimeout(() => this.inputRef.current?.focus());
  };

  handleKeyDown = (event) => {
    const prompt = '~ $';

    switch (event.key) {
      case 'Enter': {
        const {value} = this.state;

        /* TODO: parse properly the parameters wuit quotes, etc. */
        const values = value.split(' ');
        const name = values[0];
        const params = values.slice(1);

        this.sendCommand(prompt, name, params);
        this.setState({value: ''});
        break;
      }
      case 'F12': {
        if (event.altKey) {
          event.preventDefault();
          this.toggleConsole();
        }
        break;
      }
      case 'Tab': {
        event.preventDefault();
        this.askForCompletion(prompt);
        break;
      }
      case 'ArrowUp':
      case 'ArrowDown': {
        event.preventDefault();
        this.setFromHistory(event.key === 'ArrowUp');
        break;
      }
    }

    /* Handle scroll with a timeout because (just after the send, the new state
     * is not available)
     */
    this.scrollToBottom();
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.scrollToBottom();
    }, 100);
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
              value={this.state.value}
              onChange={(e) => this.setState({value: e.target.value})}
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
            {row.split('\n').map((row, index) => (
              <span key={index}>
                {row.replaceAll(' ', ' ')}
                <br />
              </span>
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

const Termux = Widget.connect((state, props) => {
  const termux = state.get('backend').get('termux');
  if (!termux) {
    return {busy: true, history: [], completion: ''};
  }

  return {
    busy: termux.get('busy', false),
    history: termux.get('history', []),
    completion: termux.get('completion', ''),
  };
})(TermuxNC);

export default Termux;
