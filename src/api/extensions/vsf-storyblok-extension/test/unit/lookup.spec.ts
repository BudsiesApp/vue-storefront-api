export {}

jest.mock('request', () => jest.fn())
jest.mock('../../../../../lib/opensearch', () => ({ getClient: jest.fn() }))
jest.mock('../../storyblok', () => ({ initStoryblokClients: jest.fn() }))
jest.mock('../../sync', () => ({ fullSync: jest.fn(), handleHook: jest.fn() }))
jest.mock('../../../../../lib/util', () => ({
  apiStatus: jest.fn((res, result, status = 200) => res.status(status).json({ code: status, result }))
}))

const { getClient } = require('../../../../../lib/opensearch')
const { checkStoryExist, getStory } = require('../../helpers')
const extension = require('../../index')

const search = jest.fn()
const response = hits => ({ body: { hits: { hits } } })
const config = { storyblok: { previewToken: 't', storiesIndex: 'stories' }, storeViews: {} }

const call = async (path, url) => {
  const router = extension({ config })
  const layer = router.stack.find(item => item.route && item.route.path === path)
  const res = { status: jest.fn(), json: jest.fn() }
  res.status.mockReturnValue(res)
  await layer.route.stack[0].handle({ params: { story: url, 0: '' } }, res)
  return res
}

describe('Storyblok lookups', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getClient.mockReturnValue({ search })
  })

  it('treats an empty successful search as a miss', async () => {
    search.mockResolvedValue(response([]))
    expect(await getStory({ search }, 'stories', 'a')).toEqual({ story: false })
    expect(await checkStoryExist({ search }, 'stories', 'a')).toBe(false)
  })

  it('returns a found story and decodes its content', async () => {
    search.mockResolvedValue(response([{ _source: { content: '{"a":1}' } }]))
    expect(await getStory({ search }, 'stories', 'a')).toEqual({ content: { a: 1 } })
    expect(await checkStoryExist({ search }, 'stories', 'a')).toBe(true)
  })

  it('propagates search and decoding failures', async () => {
    search.mockRejectedValue(new Error('down'))
    await expect(getStory({ search }, 'stories', 'a')).rejects.toThrow('down')
    await expect(checkStoryExist({ search }, 'stories', 'a')).rejects.toThrow('down')
    search.mockResolvedValue(response([{ _source: { content: '{bad' } }]))
    await expect(getStory({ search }, 'stories', 'a')).rejects.toThrow()
  })

  it('answers 500 from every read route on failure and keeps miss payloads', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    search.mockRejectedValue(new Error('down'))
    for (const path of ['/story/', '/story/:story*', '/check-exist/', '/check-exist/:story*']) {
      const res = await call(path, 'a')
      expect(res.status).toHaveBeenCalledWith(500)
    }
    search.mockResolvedValue(response([]))
    expect((await call('/story/:story*', 'a')).json).toHaveBeenCalledWith({ code: 200, result: { story: false } })
    expect((await call('/check-exist/:story*', 'a')).json).toHaveBeenCalledWith({ code: 200, result: { exist: false } })
    log.mockRestore()
  })
})
