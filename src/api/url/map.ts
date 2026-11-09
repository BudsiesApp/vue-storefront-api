import { Router } from 'express'
import { apiStatus, getCurrentStoreView, getCurrentStoreCode } from '../../lib/util'
import { getClient as getOpenSearchClient, adjustIndexName } from '../../lib/opensearch'
import ProcessorFactory from '../../processor/factory'
import get from 'lodash/get'

const map = ({ config }) => {
  const router = Router()
  router.post('/', async (req, res) => {
    const { url, excludeFields, includeFields } = req.body
    if (!url) {
      return apiStatus(res, 'Missing url', 500)
    }

    const indexName = getCurrentStoreView(getCurrentStoreCode(req)).opensearch.index
    const entities = get(config, 'urlModule.map.searchedEntities', [])
    const fields = get(config, 'urlModule.map.searchedFields', [])
    const source = {
      ...(includeFields ? { includes: includeFields.concat(get(config, 'urlModule.map.includeFields', [])) } : {}),
      ...(excludeFields ? { excludes: excludeFields } : {})
    }
    const body = entities.reduce((body, entity) => body.concat([
      { index: adjustIndexName(indexName, entity) },
      {
        query: {
          bool: {
            filter: {
              bool: {
                should: fields.map(field => ({ match_phrase: { [field]: { query: url } } }))
              }
            }
          }
        },
        size: 1,
        track_total_hits: false,
        _source: source
      }
    ]), [])

    try {
      const response = await getOpenSearchClient(config).msearch({ body })
      const responses = response.body.responses
      const failed = responses.find(result => result.error)
      if (failed) throw new Error(JSON.stringify(failed.error))

      for (let i = 0; i < entities.length; i++) {
        const result = get(responses[i], 'hits.hits[0]', null)
        if (!result || !fields.some(field => result._source[field] === url)) continue
        result._type = entities[i]
        if (result._type === 'product') {
          const factory = new ProcessorFactory(config)
          const processor = factory.getAdapter('product', indexName, req, res) || factory.getAdapter('default', indexName, req, res)
          const processed = await processor.process([result], null)
          return res.json(Object.assign(processed[0], { _type: entities[i] }))
        }
        return res.json(result)
      }
      return res.json(null)
    } catch (err) {
      console.error(err)
      return apiStatus(res, new Error('OpenSearch search error'), 500)
    }
  })

  return router
}

export default map
