export default function mergeStyleDefinitions(styleDefs) {
  styleDefs = styleDefs.filter((styleDef) => styleDef);

  if (styleDefs.length === 0) {
    throw new Error(`Missing styles`);
  }

  if (styleDefs.length === 1) {
    return styleDefs[0];
  }

  // styleDefs.reverse();

  const propNamesUsedList = styleDefs
    .map((styleDef) => styleDef.propNamesUsed)
    .filter((propNamesUsed) => propNamesUsed)
    .flat();

  let propNamesUsed;
  if (propNamesUsedList.length > 0) {
    propNamesUsed = new Set(propNamesUsedList);
  }

  const mapPropsList = styleDefs
    .map((styleDef) => styleDef.mapProps)
    .filter((mapProps) => mapProps);
  const funcList = styleDefs.map((styleDef) => styleDef.func);

  return {
    hasThemeParam: styleDefs.some((styleDef) => styleDef.hasThemeParam),
    hasPropsParam: styleDefs.some((styleDef) => styleDef.hasPropsParam),
    propNamesUsed,
    mapProps: (props, theme) =>
      mapPropsList.reduce((p, mapProps) => mapProps(p, theme), props),
    func: (theme, props) =>
      funcList.reduce(
        (styles, func) => ({...styles, ...func.bind({styles})(theme, props)}),
        {}
      ),
  };
}
