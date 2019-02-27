//T:2019-02-27
import React from 'react';
import Widget from 'laboratory/widget';
import {
  SearchkitManager,
  SearchkitProvider,
  SearchBox,
  HitsStats,
  Hits,
} from 'searchkit';

class SearchKit extends Widget {
  constructor() {
    super(...arguments);
  }
  renderHits(props) {
    console.dir(props.hits);
    return (
      <div>
        {props.hits.map((h, i) => (
          <div key={i}>
            {Object.keys(h._source).map((k, i) => (
              <div key={i}>
                {k}: {h._source[k]}
              </div>
            ))}
            <hr />
          </div>
        ))}
      </div>
    );
  }

  render() {
    const {index, fields} = this.props;
    this.searchkit = new SearchkitManager(`http://localhost:9200/${index}/`);
    this.searchkit.setQueryProcessor(q => {
      if (!q.query) {
        return q;
      }
      const query = {
        query: {
          multi_match: {
            query: q.query.simple_query_string.query,
            fields: q.query.simple_query_string.fields,
          },
        },
      };
      console.dir(query);
      return query;
    });
    return (
      <SearchkitProvider searchkit={this.searchkit}>
        <div>
          <SearchBox searchOnChange={true} queryFields={fields} />
          <HitsStats />
          <Hits
            hitsPerPage={50}
            listComponent={this.renderHits}
            highlightFields={fields}
          />
        </div>
      </SearchkitProvider>
    );
  }
}

export default SearchKit;
