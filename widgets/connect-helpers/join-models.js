export default function joinModels(baseModel, nextModel) {
  if (typeof nextModel === 'string') {
    // Add nextModel after baseModel if nextModel is relative
    if (nextModel.startsWith('.')) {
      if (nextModel === '.') {
        return baseModel;
      }
      if (!baseModel) {
        return nextModel.substring(1); // Remove '.'
      }
      return `${baseModel}${nextModel}`;
    }
    return nextModel;
  }
  return baseModel;
}
