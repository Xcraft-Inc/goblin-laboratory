//T:2019-02-27
import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import PropTypes from 'prop-types';
import importer from 'goblin_importer';
import jsToCSS from './js-to-css.js';

const themeContextImporter = importer('theme-context');

class ThemeContext extends Widget {
  constructor() {
    super(...arguments);
    this._theme = null;
  }

  getChildContext() {
    return {
      theme: this._theme,
      themeContextName: this.props.themeContextName,
    };
  }

  static get childContextTypes() {
    return {
      theme: PropTypes.object,
      themeContextName: PropTypes.string,
    };
  }

  build(themeContext) {
    let theme = this.props.theme ? this.props.theme.toJS() : null;
    if (!theme) {
      return null;
    }

    theme.baseName = theme.name;
    theme.name = `${theme.name}-${this.props.themeGen}`;

    const {
      paletteBuilder,
      shapesBuilder,
      stylesBuilder,
      transitionsBuilder,
      typoBuilder,
    } = themeContext.builders[theme.builder];

    const palette = paletteBuilder(theme.colors);
    const shapes = shapesBuilder(theme.spacing);
    const transitions = transitionsBuilder(theme.timing);
    const typo = typoBuilder(theme.spacing);

    const styles = stylesBuilder({
      colors: theme.colors,
      palette,
      shapes,
      spacing: theme.spacing,
      timing: theme.timing,
      transitions,
      typo,
      look: theme.look,
    });

    return {
      ...theme,
      styles,
      palette,
      shapes,
      transitions,
      typo,
    };
  }

  render() {
    if (!this.props.theme) {
      return null;
    }
    const themeContext = themeContextImporter(this.props.themeContextName);
    this._theme = this.build(themeContext);
    if (!this._theme) {
      return null;
    }
    const globalStyles = themeContext.getGlobalStyles(this._theme);
    if (this.props.frameThemeContext && globalStyles['.root']) {
      globalStyles[`.root-${this.props.labId.replace(/@/g, '-')}`] =
        globalStyles['.root'];
      delete globalStyles['.root'];
    }
    const fonts = themeContext.getFonts(this._theme);

    return (
      <React.Fragment>
        {/* // This <style> is not necessary without shadow dom and causes errors in aphrodite after unmount and remount */}
        {/* <style type="text/css" data-aphrodite /> */}
        {globalStyles && (
          <style
            type="text/css"
            dangerouslySetInnerHTML={{__html: jsToCSS(globalStyles)}}
          />
        )}
        {fonts && (
          <style type="text/css" dangerouslySetInnerHTML={{__html: fonts}} />
        )}
        {this.props.children}
      </React.Fragment>
    );
  }
}

export default Widget.connect((state, props) => {
  let currentTheme = state.get(`backend.${props.labId}.theme`);

  if (props.currentTheme) {
    currentTheme = props.currentTheme;
  }

  const laboratoryThemeContext = state.get(
    `backend.${props.labId}.themeContext`
  );

  const themeContextName =
    props.frameThemeContext || props.themeContext || laboratoryThemeContext;

  return {
    theme: state.get(
      `backend.theme-composer@${themeContextName}.themes.${currentTheme}`
    ),
    themeContextName: themeContextName,
  };
})(ThemeContext);
