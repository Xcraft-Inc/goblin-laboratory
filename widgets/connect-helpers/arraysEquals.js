function is(x, y) {
  if (x && typeof x.equals === 'function') {
    return x.equals(y);
  }
  return Object.is(x, y);
}

export default function arraysEquals(a1, a2) {
  if (a1 === a2) {
    return true;
  }
  if (!Array.isArray(a2)) {
    return false;
  }
  if (a1.length !== a2.length) {
    return false;
  }
  for (let i = 0; i < a1.length; i++) {
    if (!is(a1[i], a2[i])) {
      return false;
    }
  }
  return true;
}
