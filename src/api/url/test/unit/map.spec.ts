export {}

jest.mock('@opensearch-project/opensearch', () => ({ Client: jest.fn() }))
jest.mock('../../../../lib/redis', () => ({ getClient: jest.fn() }))
jest.mock('../../../../lib/util', () => ({
  getCurrentStoreCode: jest.fn(() => 'petsies'),
  getCurrentStoreView: jest.fn(() => ({ opensearch: { index: 'base_3' } })),
  apiStatus: jest.fn((res, result, status) => res.status(status).json(result))
}))
jest.mock('../../../../lib/opensearch', () => ({
  ...jest.requireActual('../../../../lib/opensearch'),
  getClient: jest.fn()
}))
jest.mock('../../../../processor/factory', () => ({ __esModule: true, default: jest.fn() }))

const { Client } = require('@opensearch-project/opensearch')
const redis = require('../../../../lib/redis')
const { getClient } = require('../../../../lib/opensearch')
const { getCurrentStoreCode, getCurrentStoreView } = require('../../../../lib/util')
const ProcessorFactory = require('../../../../processor/factory').default
const map = require('../../map').default

const entities = ['product', 'category', 'cms_page']
const config = { urlModule: { map: { searchedEntities: entities, searchedFields: ['url_key', 'url_path'], includeFields: ['id'] } } }
const hit = (url = 'match') => ({ _index: 'unrelated_physical_1793000000_abcd1234', _source: { url_key: url }, _score: 1 })
const result = (hits = []) => ({ hits: { hits } })
const msearch = jest.fn()
const processHits = jest.fn(async hits => hits.map(item => ({ ...item, processed: true, _type: undefined })))
const getAdapter = jest.fn(() => ({ process: processHits }))

const run = async (responses, projection = {}) => {
  msearch.mockResolvedValue({ body: { responses } })
  const router = map({ config })
  const handler = router.stack[0].route.stack[0].handle
  const req = { body: { url: 'match', ...projection } }
  const res = { json: jest.fn(), status: jest.fn() }
  res.status.mockReturnValue(res)
  await handler(req, res)
  return { req, res }
}

describe('URL alias mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getClient.mockReturnValue({ msearch })
    ProcessorFactory.mockImplementation(() => ({ getAdapter }))
  })

  it('does not open engine or Redis connections on import', () => {
    expect(Client).not.toHaveBeenCalled()
    expect(redis.getClient).not.toHaveBeenCalled()
    expect(getClient).not.toHaveBeenCalled()
  })

  it('uses one ordered msearch with body projections and positional entity identity', async () => {
    const item = hit()
    const { req, res } = await run([result(), result([item]), result()], { includeFields: ['name'], excludeFields: ['secret'] })
    expect(msearch).toHaveBeenCalledTimes(1)
    const body = msearch.mock.calls[0][0].body
    expect(body).toHaveLength(6)
    entities.forEach((entity, i) => {
      expect(body[i * 2]).toEqual({ index: `base_3_${entity}` })
      expect(body[i * 2 + 1]).toEqual({
        query: { bool: { filter: { bool: { should: ['url_key', 'url_path'].map(field => ({ match_phrase: { [field]: { query: 'match' } } })) } } } },
        size: 1,
        track_total_hits: false,
        _source: { includes: ['name', 'id'], excludes: ['secret'] }
      })
    })
    expect(getCurrentStoreCode).toHaveBeenCalledWith(req)
    expect(getCurrentStoreView).toHaveBeenCalledWith('petsies')
    expect(res.json).toHaveBeenCalledWith({ ...item, _type: 'category' })
  })

  it('chooses the first configured exact match and preserves product identity after processing', async () => {
    const item = hit()
    const { req, res } = await run([result([item]), result([hit()]), result([hit()])])
    expect(getAdapter).toHaveBeenCalledWith('product', 'base_3', req, res)
    expect(processHits).toHaveBeenCalledWith([item], null)
    expect(res.json).toHaveBeenCalledWith({ ...item, processed: true, _type: 'product' })
    expect(msearch.mock.calls[0][0].body[1]._source).toEqual({})
  })

  it('continues after mismatches and derives CMS identity from position', async () => {
    const { res } = await run([result([hit('MATCH')]), result(), result([hit()])])
    expect(res.json.mock.calls[0][0]._type).toBe('cms_page')
    expect(processHits).not.toHaveBeenCalled()
  })

  it('returns null when no hit exactly matches', async () => {
    const { res } = await run([result([hit('different')]), result(), result()])
    expect(res.json).toHaveBeenCalledWith(null)
  })

  it('checks every sub-response error before choosing an earlier matching hit', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { res } = await run([result([hit()]), { error: { type: 'index_not_found_exception' } }, result()])
    expect(res.status).toHaveBeenCalledWith(500)
    expect(processHits).not.toHaveBeenCalled()
    expect(res.json.mock.calls[0][0]).toBeInstanceOf(Error)
    log.mockRestore()
  })

  it('uses the existing error path for top-level client failure', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    msearch.mockRejectedValueOnce(new Error('unavailable'))
    const { res } = await run([])
    expect(res.status).toHaveBeenCalledWith(500)
    log.mockRestore()
  })
})
