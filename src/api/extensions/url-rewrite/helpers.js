import { adjustIndexName } from '../../../lib/opensearch'

function getHitsAsRewrite (hits) {
  if (hits.hits.length === 0) {
    return;
  }

  const rewrite = hits.hits[0]._source;

  return rewrite;
}

export const getUrlRewriteByRequestPath = async (db, config, requestPath) => {
  const indexName = adjustIndexName(config.opensearch.index, 'url_rewrite');

  try {
    const response = await db.search({
      index: indexName,
      size: 1,
      body: {
        query: {
          term: {
            'request_path': requestPath.toLowerCase()
          }
        }
      }
    });

    const hits = response.body.hits;

    return getHitsAsRewrite(hits);
  } catch (error) {
    throw new Error('Error due to the rewrite searching: ' + error.message);
  }
}
