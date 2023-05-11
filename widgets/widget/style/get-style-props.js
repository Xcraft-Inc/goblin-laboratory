export default function getStyleProps(myStyle, props, theme, widgetName) {
  if (!myStyle.hasPropsParam) {
    return null;
  }
  let propNamesUsed = myStyle.propNamesUsed;
  if (!propNamesUsed) {
    throw new Error(`propNames is not defined in styles.js of ${widgetName}`);
  }

  let styleProps = {};
  propNamesUsed.forEach((p) => {
    styleProps[p] = props[p];
  });
  if (myStyle.mapProps) {
    styleProps = myStyle.mapProps(styleProps, theme);
  }
  return styleProps;
}
