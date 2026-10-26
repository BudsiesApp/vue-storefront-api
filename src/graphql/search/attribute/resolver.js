import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';
import { getIndexName } from '../mapping'
import { adjustQuery, getTotal } from './../../../lib/opensearch'

async function listAttributes (attributes, context, rootValue, _sourceIncludes) {
  let query = buildQuery({ filter: attributes, pageSize: 150, type: 'attribute' });

  if (_sourceIncludes === undefined) {
    _sourceIncludes = config.entities.attribute.includeFields
  }

  const searchQuery = {
    index: getIndexName(context.req.url),
    body: query,
    _source_includes: _sourceIncludes
  };

  const response = await client.search(adjustQuery(searchQuery, 'attribute'));

  response.body.hits.total = getTotal(response.body.hits.total)

  return response.body;
}

const resolver = {
  Query: {
    customAttributeMetadata: (_, { attributes, _sourceInclude }, context, rootValue) => listAttributes(attributes, context, rootValue, _sourceInclude)
  }
};

export default resolver;
