import {connect} from 'react-redux';
import Shredder from 'xcraft-core-shredder';
import {matchPath} from 'react-router';
import {getParameter} from '../../lib/helpers.js';
import shallowEqualShredder from '../widget/utils/shallowEqualShredder.js';

export function withRoute(path, watchedParams, watchedSearchs, watchHash) {
  return connect(
    (state) => {
      const router = new Shredder(state.router);
      const location = router.get('location');
      if (!location) {
        return {};
      }

      const pathName = router.get('location.pathname');
      const search = router.get('location.search');

      const match = matchPath(pathName, {
        path,
        exact: false,
        strict: false,
      });

      let withSearch = null;

      if (Array.isArray(watchedSearchs)) {
        for (const s of watchedSearchs) {
          if (!withSearch) {
            withSearch = {};
          }
          withSearch[s] = getParameter(search, s);
        }
      } else {
        withSearch = {
          [watchedSearchs]: getParameter(search, watchedSearchs),
        };
      }

      let withHash = null;
      if (watchHash) {
        withHash = {hash: router.get('location.hash')};
      }

      if (Array.isArray(watchedParams)) {
        const params = {};
        for (const p of watchedParams) {
          params[p] = !match ? null : match.params[p];
        }
        return {
          isDisplayed: !!match,
          ...params,
          ...withSearch,
          ...withHash,
        };
      } else {
        return {
          isDisplayed: !!match,
          [watchedParams]: !match ? null : match.params[watchedParams],
          ...withSearch,
          ...withHash,
        };
      }
    },
    null,
    null,
    {
      pure: true,
      areOwnPropsEqual: shallowEqualShredder,
      areStatePropsEqual: shallowEqualShredder,
      areMergedPropsEqual: shallowEqualShredder,
    }
  );
}

export default function WithRoute(
  component,
  watchedParams,
  watchedSearchs,
  watchHash
) {
  return (path) => {
    return withRoute(path, watchedParams, watchedSearchs, watchHash)(component);
  };
}
