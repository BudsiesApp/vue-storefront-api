import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';
import searchResultsProcessor from './processor'
import { getIndexName } from '../mapping'
import { adjustQuery, getTotal } from './../../../lib/opensearch'
import AttributeService from './../../../api/attribute/service'

const resolver = {
  Query: {
    products: (_, { search, filter, sort, currentPage, pageSize, _sourceInclude, _sourceExclude }, context, rootValue) =>
      list(filter, sort, currentPage, pageSize, search, context, rootValue, _sourceInclude, _sourceExclude)
  }
};

async function list (filter, sort, currentPage, pageSize, search, context, rootValue, _sourceInclude, _sourceExclude) {
  let _req = {
    query: {
      _source_exclude: _sourceExclude,
      _source_include: _sourceInclude
    }
  }

  let query = buildQuery({
    filter: filter,
    sort: sort,
    currentPage: currentPage,
    pageSize: pageSize,
    search: search,
    type: 'product'
  });

  let indexName = getIndexName(context.req.url)

  let searchResponse = await client.search(adjustQuery({
    index: indexName,
    body: { ...query, track_total_hits: true },
    _source_includes: _sourceInclude,
    _source_excludes: _sourceExclude
  }, 'product'));

  if (searchResponse && searchResponse.body.hits && searchResponse.body.hits.hits) {
    // process response result (caluclate taxes etc...)
    searchResponse.body.hits.hits = await searchResultsProcessor(searchResponse, _req, 'product', indexName);
  }

  let response = {}

  // Process hits
  response.items = []
  searchResponse.body.hits.hits.forEach(hit => {
    let item = hit._source
    item._score = hit._score
    response.items.push(item)
  });

  response.total_count = getTotal(searchResponse.body.hits.total)

  // Process sort
  let sortOptions = []
  for (var sortAttribute in sort) {
    sortOptions.push(
      {
        label: sortAttribute,
        value: sortAttribute
      }
    )
  }

  response.aggregations = searchResponse.body.aggregations

  if (response.aggregations && config.entities.attribute.loadByAttributeMetadata) {
    const attributeListParam = AttributeService.transformAggsToAttributeListParam(response.aggregations)
    const attributeList = await AttributeService.list(attributeListParam, config, indexName)
    response.attribute_metadata = attributeList.map(AttributeService.transformToMetadata)
  }

  response.sort_fields = {}
  if (sortOptions.length > 0) {
    response.sort_fields.options = sortOptions
  }

  response.page_info = {
    page_size: pageSize,
    current_page: currentPage
  }

  return response;
}

export default resolver;
