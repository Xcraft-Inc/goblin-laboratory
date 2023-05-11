import computeStyleHash from './compute-style-hash.js';
import getStyleProps from './get-style-props.js';
import {StyleSheet as Aphrodite} from 'aphrodite/no-important';
import traverse from 'traverse';
import StylesCache from './styles-cache.js';

let stylesCache = new StylesCache();

export function clearStylesCache() {
  stylesCache = new StylesCache();
}

// See https://github.com/Khan/aphrodite/issues/319#issuecomment-393857964
const {StyleSheet, css} = Aphrodite.extend([
  {
    selectorHandler: (selector, baseSelector, generateSubtreeStyles) => {
      const nestedTags = [];
      const selectors = selector.split(',');
      _.each(selectors, (subselector, key) => {
        if (selector[0] === '&') {
          const tag = key === 0 ? subselector.slice(1) : subselector;
          const nestedTag = generateSubtreeStyles(
            `${baseSelector}${tag}`.replace(/ +(?= )/g, '')
          );
          nestedTags.push(nestedTag);
        }
      });
      return _.isEmpty(nestedTags) ? null : _.flattenDeep(nestedTags);
    },
  },
]);

const injectCSS = (classes) => {
  traverse(classes).forEach(function (style) {
    if (style === undefined || style === null) {
      this.delete();
    }
  });

  const sheet = StyleSheet.create(classes);
  Object.keys(sheet).forEach((key) => (sheet[key] = css(sheet[key])));
  return sheet;
};

export default function buildStyle(styleDef, theme, props, widgetName) {
  const styleProps = getStyleProps(styleDef, props, theme, widgetName);
  const hash = computeStyleHash(styleDef, theme, styleProps);

  const style = stylesCache.get(styleDef.func, hash);
  if (style) {
    return style;
  }

  const jsStyles = styleDef.func(theme, styleProps);
  const newStyle = {
    classNames: injectCSS(jsStyles),
    props: jsStyles,
  };

  stylesCache.set(styleDef.func, hash, newStyle);

  return newStyle;
}
