import safeStringify from 'safe-stable-stringify';

export default function computeStyleHash(myStyle, theme, styleProps) {
  let hashProps = '';
  if (myStyle.hasPropsParam) {
    hashProps = safeStringify(styleProps);
  }

  let hashTheme = '';
  if (myStyle.hasThemeParam) {
    hashTheme = theme.cacheName;
  }

  return `${hashTheme}${hashProps}`;
}
