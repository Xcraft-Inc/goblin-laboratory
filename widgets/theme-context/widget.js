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
      themeContextName: this.props.themeContext,
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

    const themesGen = this.props.themesGen;
    const themeGen = themesGen ? themesGen.get(this.props.currentTheme, 1) : 1;
    theme.cacheName = `${theme.name}-${themeGen}`;

    const {
      colors = theme.colors,
      spacing = theme.spacing,
      timing = theme.timing,
      look = theme.look,
      paletteBuilder,
      shapesBuilder,
      stylesBuilder,
      transitionsBuilder,
      typoBuilder,
    } = themeContext.builders[theme.builder];

    const palette = paletteBuilder(colors);
    const shapes = shapesBuilder(spacing, colors);
    const transitions = transitionsBuilder(timing);
    const typo = typoBuilder(spacing);

    const styles = stylesBuilder({
      colors: colors,
      palette,
      shapes,
      spacing: spacing,
      timing: timing,
      transitions,
      typo,
      look: look,
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
    const themeContext = themeContextImporter(this.props.themeContext);
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
      // The `key` prop forces all children to be recreated when the theme changes
      // Changing the (legacy) context is not sufficient to redraw the children
      <React.Fragment key={this._theme.cacheName}>
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
  const {labId, themeContext, currentTheme} = props;
  const themesGen = state.get(`backend.${labId}.themesGen`);

  if (!state.has(`backend.theme-composer@${themeContext}`)) {
    console.warn(`theme context "${themeContext}" is missing`);
  }

  return {
    theme: state.get(
      `backend.theme-composer@${themeContext}.themes.${currentTheme}`
    ),
    themesGen,
  };
})(ThemeContext);
