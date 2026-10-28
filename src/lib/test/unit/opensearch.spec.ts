export {}

jest.mock('@opensearch-project/opensearch', () => ({ Client: jest.fn() }))
jest.mock('../../redis', () => ({ getClient: jest.fn() }))

jest.mock('request', () => jest.fn())
jest.mock('../../../processor/factory', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../cache-instance', () => ({ __esModule: true, default: null }))
jest.mock('../../../api/attribute/service', () => ({ __esModule: true, default: {} }))
jest.mock('../../../helpers/loadCustomFilters', () => ({ __esModule: true, default: jest.fn(async () => []) }))
jest.mock('../../util', () => ({ apiError: jest.fn() }))
jest.mock('storefront-query-builder', () => ({
  elasticsearch: { buildQueryBodyFromSearchQuery: jest.fn(async () => ({ query: { match_all: {} } })) },
  SearchQuery: jest.fn()
}))

const { Client } = require('@opensearch-project/opensearch')
const redis = require('../../redis')
const { adjustIndexName, adjustQuery, adjustBackendProxyUrl, getHits, getTotal } = require('../../opensearch')
const querystring = require('querystring')

const fixture = (settings = {}, entities: Record<string, any> = {}) => ({
  opensearch: {
    protocol: 'http',
    host: 'os1',
    port: 9200,
    useRequestFilter: true,
    overwriteRequestSourceParams: false,
    requestParamsBlacklist: [],
    cacheRequest: false,
    ...settings
  },
  entities
})

const forward = (query, config = fixture(), method = 'GET', body = {}) => {
  const req = { method, body, url: `/base/product/_search?${query}`, query: { original: 'retained' } }
  const original = JSON.parse(JSON.stringify(req))
  const url = adjustBackendProxyUrl(req, 'base', 'product', config)
  expect(req).toEqual(original)
  expect(url.split('?')[0]).toBe('http://os1:9200/base_product/_search')
  return querystring.parse(url.split('?')[1])
}

describe('OpenSearch runtime helpers', () => {
  it('does not connect to OpenSearch or Redis on import', () => {
    expect(Client).not.toHaveBeenCalled()
    expect(redis.getClient).not.toHaveBeenCalled()
  })

  it('resolves aliases and removes mapping types', () => {
    expect(adjustIndexName('vue_storefront_catalog_3', 'cms_page')).toBe('vue_storefront_catalog_3_cms_page')
    expect(adjustQuery({ index: 'base', type: 'old', body: {} }, 'product')).toEqual({ index: 'base_product', body: {} })
    expect(getHits({ body: { hits: { hits: [{ _id: '1' }] } } })).toEqual([{ _id: '1' }])
  })

  for (const method of ['GET', 'POST']) {
    describe(method, () => {
      it('merges configured filters first and canonicalizes repeated spellings', () => {
        const config = fixture({}, { product: { includeFields: ['id', 'name'], excludeFields: ['secret'] } })
        expect(forward('_source_include=sku,name&_source_include=%20id%20,,&_source_includes=url_key,sku&_source_exclude=cost&_source_excludes=secret,private', config, method)).toEqual({
          _source_includes: 'id,name,sku,url_key',
          _source_excludes: 'secret,cost,private',
          track_total_hits: 'true'
        })
      })

      it('uses only configured filters with overwrite, including null/empty lists', () => {
        const config = fixture({ overwriteRequestSourceParams: true }, { product: { includeFields: ['id'], excludeFields: null } })
        expect(forward('_source_include=sku&_source_exclude=secret', config, method)).toEqual({ _source_includes: 'id', track_total_hits: 'true' })
        config.entities.product.includeFields = []
        expect(forward('_source_includes=sku', config, method)).toEqual({ track_total_hits: 'true' })
      })

      for (const blocked of ['_source_include', '_source_includes']) {
        it(`blocks both include spellings using ${blocked} without entity settings`, () => {
          const config = fixture({ requestParamsBlacklist: [blocked, 'routing'], overwriteRequestSourceParams: true })
          expect(forward('_source_include=sku&_source_includes=id&routing=store&size=2', config, method)).toEqual({ size: '2', track_total_hits: 'true' })
        })
      }

      it('blocks either exclude spelling without removing configured filters', () => {
        for (const blocked of ['_source_exclude', '_source_excludes']) {
          const config = fixture({ requestParamsBlacklist: [blocked, '_source_includes'] }, { product: { includeFields: ['id'], excludeFields: ['secret'] } })
          expect(forward('_source_include=sku&_source_exclude=cost&_source_excludes=private', config, method)).toEqual({ _source_includes: 'id', _source_excludes: 'secret', track_total_hits: 'true' })
        }
      })

      it('keeps caller filters without entity settings despite overwrite', () => {
        expect(forward('_source_exclude=secret&_source_includes=sku', fixture({ overwriteRequestSourceParams: true }), method)).toEqual({ _source_excludes: 'secret', _source_includes: 'sku', track_total_hits: 'true' })
      })

      it('ignores blacklist and entity filters when filtering is disabled', () => {
        const config = fixture({ useRequestFilter: false, requestParamsBlacklist: ['routing', '_source_excludes'], overwriteRequestSourceParams: true }, { product: { includeFields: ['id'], excludeFields: ['configured'] } })
        expect(forward('_source_exclude=secret&routing=store', config, method)).toEqual({ _source_excludes: 'secret', routing: 'store', track_total_hits: 'true' })
      })

      it('encodes engine parameters, strips app/body override controls and forces exact tracking', () => {
        const query = querystring.stringify({
          request: '{}',
          request_format: 'search-query',
          response_format: 'compact',
          'x-app-version': '1',
          'x-instance-id': '2',
          type: 'product',
          source: '{}',
          source_content_type: 'application/json',
          from: '10',
          size: '5',
          sort: 'name:asc',
          routing: 'a&b +/é',
          preference: '_local',
          request_cache: 'false',
          track_total_hits: 'false'
        })
        expect(forward(query, fixture(), method, { _source: { includes: ['body'], excludes: ['private'] }, track_total_hits: false })).toEqual({
          from: '10',
          size: '5',
          sort: 'name:asc',
          routing: 'a&b +/é',
          preference: '_local',
          request_cache: 'false',
          track_total_hits: 'true'
        })
        expect(forward('track_total_hits=10&request_cache=false', fixture({ cacheRequest: true, requestParamsBlacklist: ['track_total_hits'] }), method)).toEqual({ request_cache: 'true', track_total_hits: 'true' })
      })

      it('preserves body source filters when query overwrite is enabled', () => {
        expect(forward('_source_include=sku', fixture({ overwriteRequestSourceParams: true }, { product: { includeFields: [] } }), method, { _source: ['body'] })).toEqual({ track_total_hits: 'true' })
      })
    })
  }

  it.each([
    [{ value: 12001, relation: 'eq' }, 12001],
    [42, 42],
    [0, 0],
    [{ value: 0, relation: 'eq' }, 0],
    [undefined, 0]
  ])('normalizes total %p to %p', (total, expected) => {
    expect(getTotal(total)).toBe(expected)
  })
})

const request = require('request')
const ProcessorFactory = require('../../../processor/factory').default
const catalog = require('../../../api/catalog').default
const { apiError } = require('../../util')
const { elasticsearch } = require('storefront-query-builder')

describe('catalog proxy boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ProcessorFactory.mockImplementation(() => ({ getAdapter: () => ({ process: async hits => hits }) }))
  })

  const run = async (method, query = {}, body = undefined, path = '/base/product/_search') => {
    const config = {
      ...fixture(),
      server: { useOutputCache: false },
      entities: { attribute: { loadByAttributeMetadata: false } },
      get: () => false
    }
    config.opensearch['indices'] = ['base']
    const req = { method, query, body, url: `${path}?${querystring.stringify(query)}` }
    const res = { json: jest.fn(), setHeader: jest.fn() }
    await catalog({ config, db: {} })(req, res)
    return { req, res, config }
  }

  for (const method of ['GET', 'POST']) {
    it(`${method} consumes group and body count controls while preserving body source`, async () => {
      const body = { _source: { includes: ['id'], excludes: ['secret'] }, groupId: 2, groupToken: '', track_total_hits: false }
      const query = method === 'GET' ? { request: JSON.stringify(body), track_total_hits: '10' } : { track_total_hits: 'false' }
      await run(method, query, method === 'POST' ? body : undefined)
      const forwarded = request.mock.calls[0][0]
      expect(forwarded.body).toEqual({ _source: { includes: ['id'], excludes: ['secret'] } })
      expect(querystring.parse(forwarded.uri.split('?')[1])).toEqual({ track_total_hits: 'true' })
    })

    it(`${method} uses an empty body when none is provided`, async () => {
      await run(method)
      expect(request.mock.calls[0][0].body).toEqual({})
    })
  }

  it('passes the query-builder a local compatibility config', async () => {
    const { config } = await run('GET', { request: '{}', request_format: 'search-query' })
    const boundary = elasticsearch.buildQueryBodyFromSearchQuery.mock.calls[0][0].config
    expect(boundary).not.toBe(config)
    expect(boundary.elasticsearch).toBe(config.opensearch)
    expect(config).not.toHaveProperty('elasticsearch')
    expect(request.mock.calls[0][0].body).toEqual({ query: { match_all: {} } })
  })

  it.each(['standard', 'compact'])('normalizes totals before %s formatting', async format => {
    const { res } = await run('GET', { response_format: format })
    await request.mock.calls[0][1](null, {}, { hits: { total: { value: 12001, relation: 'eq' }, hits: [{ _source: { id: 1 }, _score: 2 }] }, aggregations: { kept: {} } })
    const body = res.json.mock.calls[0][0]
    expect(format === 'compact' ? body.total : body.hits.total).toBe(12001)
    expect(body.aggregations).toEqual({ kept: {} })
  })

  it.each(['/base/_search', '/base/product/_search/extra', '/base/product,category/_search', '/base/*/_search'])('rejects unsafe path %s', async path => {
    await run('GET', {}, undefined, path)
    expect(apiError.mock.calls[0][1].code).toBe(400)
    expect(request).not.toHaveBeenCalled()
  })

  it('rejects inaccessible bases before searching', async () => {
    await run('GET', {}, undefined, '/other/product/_search')
    expect(apiError).toHaveBeenCalled()
    expect(request).not.toHaveBeenCalled()
  })

  it('forwards unknown aliases and preserves engine error behavior without fallback', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { res } = await run('GET', {}, undefined, '/base/unknown/_search')
    expect(request.mock.calls[0][0].uri).toContain('/base_unknown/_search')
    const error = { type: 'index_not_found_exception' }
    await request.mock.calls[0][1](null, {}, { error })
    expect(apiError).toHaveBeenCalledWith(res, error)
    expect(request).toHaveBeenCalledTimes(1)
    log.mockRestore()
  })
})
