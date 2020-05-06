module.exports = {
  getParameter: (search, name) => {
    if (!search) {
      return null;
    }
    const query = search.substring(1);
    const vars = query.split('&');
    for (const v of vars) {
      const pair = v.split('=');
      if (decodeURIComponent(pair[0]) === name) {
        return decodeURIComponent(pair[1]);
      }
    }
    return null;
  },
};
