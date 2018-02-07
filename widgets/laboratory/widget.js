import React from 'react';
import {Helmet} from 'react-helmet';
import toCss from 'obj-to-css';
import cssKey from 'css-key';
import PropTypes from 'prop-types';
import {Theme} from 'electrum-theme';
import Widget from 'laboratory/widget';
import importer from '../importer/';
const widgetImporter = importer ('widget');

class ThemeContext extends React.PureComponent {
  getChildContext () {
    return {
      theme: this.props.theme,
    };
  }

  static get childContextTypes () {
    return {
      theme: PropTypes.object,
    };
  }

  render () {
    return this.props.children;
  }
}

class Laboratory extends Widget {
  constructor () {
    super (...arguments);
  }

  static get wiring () {
    return {
      id: 'id',
      root: 'root',
      theme: 'theme',
    };
  }

  get globalStyles () {
    return {
      body: {
        color: '#999',
        fontFamily: [
          'Open Sans',
          'Helvetica',
          'Arial',
          'Verdana',
          'sans-serif',
        ],
        fontWeight: 300,
        margin: 0,
        padding: 0,
        userSelect: 'none',
      },

      pre: {
        display: 'block',
        margin: 0,
      },

      xmp: {
        display: 'block',
        margin: 0,
      },

      plaintext: {
        display: 'block',
        margin: 0,
      },

      listing: {
        display: 'block',
        margin: 0,
      },

      code: {
        font: 'inherit',
        color: 'rgb(56, 56, 56)',
        backgroundColor: 'rgb(193, 209, 224)',
        padding: '1px',
        margin: 0,
      },

      h1: {
        fontSize: '100%',
        fontWeight: 300,
        color: '#666',
        margin: '0px',
        marginTop: '8px',
      },

      'h1:firstOfType': {
        marginTop: '0px',
      },

      h2: {
        fontSize: '90%',
        fontWeight: 300,
        color: '#666',
        margin: '0px',
        marginTop: '8px',
      },

      'h2:firstOfType': {
        marginTop: 0,
      },

      p: {
        margin: 0,
      },

      ul: {
        fontSize: '80%',
        margin: 0,
        paddingLeft: '30px',
        listStyleType: 'disc',
      },

      ol: {
        fontSize: '80%',
        margin: 0,
        paddingLeft: '30px',
      },

      '::WebkitScrollbar': {
        width: '14px',
        height: '14px',
      },

      '::WebkitScrollbarTrack': {},

      '::WebkitScrollbarThumb': {
        boxShadow: 'inset 0 0 14px 14px #ccc',
        border: 'solid 2px transparent',
        borderRadius: '8px',
      },

      '::WebkitScrollbarThumb:hover': {
        boxShadow: 'inset 0 0 14px 14px #aaa',
      },
    };
  }

  static _JsToCSS (jsStyles) {
    return toCss (
      Object.assign (
        {},
        ...Object.keys (jsStyles).map (className => {
          return {
            [cssKey (className)]: Object.assign (
              {},
              ...Object.keys (jsStyles[className]).map (key => {
                return {[cssKey (key)]: jsStyles[className][key]};
              })
            ),
          };
        })
      )
    );
  }

  render () {
    const {id, root} = this.props;

    if (!id) {
      return null;
    }

    if (!root) {
      return (
        <div>Missing root widget, please use lab.setRoot ({`{widgetId}`})</div>
      );
    }

    const widgetName = root.split ('@')[0];
    const RootWidget = widgetImporter (widgetName);
    const WiredRoot = Widget.Wired (RootWidget) (root);
    return (
      <ThemeContext theme={Theme.create (this.props.theme)}>
        <Helmet>
          <style>{Laboratory._JsToCSS (this.globalStyles)}</style>
        </Helmet>
        <WiredRoot />
      </ThemeContext>
    );
  }
}

export default Laboratory;
