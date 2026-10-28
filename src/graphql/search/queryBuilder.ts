import bodybuilder from 'bodybuilder';
import { elasticsearch, ElasticsearchQueryConfig } from 'storefront-query-builder'
import config from 'config'

export function buildQuery ({
  filter = [],
  sort = '',
  currentPage = 1,
  pageSize = 10,
  search = '',
  type = 'product'
}) {
  let queryChain = bodybuilder();
  const opensearch = config.get<ElasticsearchQueryConfig['elasticsearch'] & { min_score: number }>('opensearch')
  const queryConfig: ElasticsearchQueryConfig = { ...config, elasticsearch: opensearch }
  elasticsearch.buildQueryBodyFromFilterObject({ config: queryConfig, queryChain, filter, search })
  queryChain = elasticsearch.applySort({ sort, queryChain });
  queryChain = queryChain.from((currentPage - 1) * pageSize).size(pageSize);

  let builtQuery = queryChain.build()
  if (search !== '') {
    builtQuery['min_score'] = opensearch.min_score
  }
  return builtQuery;
}
