function getHits (result) {
  if (result.body) { // differences between ES5 andd ES7
    return result.body.hits;
  } else {
    return result.hits;
  }
}

function getHitsAsRewrite (hits) {
  if (hits.total === 0) {
    return;
  }

  const rewrite = hits.hits[0]._source;

  return rewrite;
}

export const getUrlRewriteByRequestPath = async (db, config, requestPath) => {
  const indexName = config.elasticsearch.index;
  
  try {
    const response = await db.search({
      index: indexName,
      type: 'url_rewrite',
      size: 1,
      body: {
        query: {
          bool: {
            must: {
              match: {
                'request_path': requestPath
              }
            }
          }
        }
      }
    });

    const hits = getHits(response);

    return getHitsAsRewrite(hits);
  } catch (error) {
    throw new Error('Error due to the rewrite searching: ' + error.message);
  }
}
