export {}

jest.mock('../../../../../lib/opensearch', () => ({
  ...jest.requireActual('../../../../../lib/opensearch'),
  getClient: jest.fn()
}))
jest.mock('../../../../../lib/util', () => ({
  apiStatus: jest.fn((res, result, status = 200) => res.status(status).json({ code: status, result }))
}))

const { getClient } = require('../../../../../lib/opensearch')
const extension = require('../../index')

const search = jest.fn()
const config = { opensearch: { index: 'base' }, extensions: { urlRewrite: { enabled: true } } }

const call = async (query) => {
  const handler = extension({ config }).stack[0].route.stack[0].handle
  const res = { status: jest.fn(), json: jest.fn() }
  res.status.mockReturnValue(res)
  await handler({ query }, res)
  return res
}

describe('url-rewrite redirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getClient.mockReturnValue({ search })
  })

  it('answers 400 without searching when requestPath is missing', async () => {
    const res = await call({})
    expect(res.status).toHaveBeenCalledWith(400)
    expect(search).not.toHaveBeenCalled()
  })

  it('answers 200 for a rewrite and 404 for a miss', async () => {
    search.mockResolvedValueOnce({ body: { hits: { hits: [{ _source: { target_path: 'x' } }] } } })
    expect((await call({ requestPath: 'a' })).status).toHaveBeenCalledWith(200)
    search.mockResolvedValueOnce({ body: { hits: { hits: [] } } })
    expect((await call({ requestPath: 'a' })).status).toHaveBeenCalledWith(404)
  })

  it('answers 500 when the search fails', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    search.mockRejectedValue(new Error('down'))
    expect((await call({ requestPath: 'a' })).status).toHaveBeenCalledWith(500)
    log.mockRestore()
  })
})
