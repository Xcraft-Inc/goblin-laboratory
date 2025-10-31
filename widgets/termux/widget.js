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

  askForCompletion = () => {
    const input = this.inputRef.current?.value;
    this.doFor('termux', 'askForCompletion', {input});
  };

  setFromHistory = (up) => {
    const input = this.inputRef.current?.value;
    this.doFor('termux', 'setFromHistory', {up, input});
  };

  clearCompletion = () => {
    this.doFor('termux', 'clearCompletion');
  };

  sendCommand = (command) => {
    this.doFor('termux', 'beginCommand', {command});
  };

  setCliFocus = () => {
    setTimeout(() => this.inputRef.current?.focus());
  };

  handleKeyDown = (event) => {
    switch (event.key) {
      /* Valid the command line */
      case 'Enter': {
        const {value} = this.state;
        this.sendCommand(value);
        this.setState({value: ''});
        break;
      }
      /* Show or hide the console */
      case 'F12': {
        if (event.altKey) {
          event.preventDefault();
          this.toggleConsole();
        }
        break;
      }
      /* Try to autocomplete */
      case 'Tab': {
        event.preventDefault();
        this.askForCompletion();
        break;
      }
      /* Move into the command history */
      case 'ArrowUp':
      case 'ArrowDown': {
        event.preventDefault();
        this.setFromHistory(event.key === 'ArrowUp');
        break;
      }
      /* [a] move to the begining, [e] move to the end */
      case 'a':
      case 'e': {
        if (event.ctrlKey) {
          event.preventDefault();
          if (event.key === 'a') {
            this.inputRef.current.setSelectionRange(0, 0);
          } else if (event.key === 'e') {
            const {length} = this.inputRef.current.value;
            this.inputRef.current.setSelectionRange(length, length);
          }
          this.inputRef.current.focus();
        }
        break;
      }
      /* Erase the whole line */
      case 'u': {
        if (event.ctrlKey) {
          this.setState({value: ''});
        }
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
    const {prompt, busy} = this.props;
    return (
      <div className="cli">
        {busy ? (
          <span>&nbsp;</span>
        ) : (
          <>
            <span>{prompt}&nbsp;</span>
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
    return {prompt: '~ $', busy: true, history: [], completion: ''};
  }
  return {
    prompt: termux.get('prompt', '~ $'),
    busy: termux.get('busy', false),
    history: termux.get('history', []),
    completion: termux.get('completion', ''),
  };
})(TermuxNC);

export default Termux;
