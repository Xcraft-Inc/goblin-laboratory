import fasterStringify from 'faster-stable-stringify';

export default function computeStyleHash(myStyle, theme, styleProps) {
  let hashProps = '';
  if (myStyle.hasPropsParam) {
    hashProps = fasterStringify(styleProps);
  }

  let hashTheme = '';
  if (myStyle.hasThemeParam) {
    hashTheme = theme.cacheName;
  }

  return `${hashTheme}${hashProps}`;
}
