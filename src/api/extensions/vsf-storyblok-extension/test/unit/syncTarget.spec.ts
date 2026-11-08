export {}

const mockConfig = { storyblok: { invalidate: 'http://cache/{{tag}}' } }
const mockSeedDatabase = jest.fn()
const mockSeedDatasources = jest.fn()
const mockCacheInvalidate = jest.fn()

jest.mock('config', () => mockConfig)
jest.mock('../../../../../lib/opensearch', () => ({ getClient: jest.fn(() => ({})) }))
jest.mock('../../storyblok', () => ({ initStoryblokClients: jest.fn() }))
jest.mock('../../sync', () => ({
  seedDatabase: mockSeedDatabase,
  seedStoryblokDatasources: mockSeedDatasources
}))
jest.mock('../../helpers', () => ({
  cacheInvalidate: mockCacheInvalidate,
  log: jest.fn()
}))

const { syncTarget } = require('../../syncTarget')

const db = {}
const flush = async () => {
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setImmediate(resolve))
  }
}
const deferred = () => {
  let settle
  const promise = new Promise(resolve => { settle = resolve })
  return { promise, resolve: () => settle() }
}
const settled = (promise: Promise<unknown>) => {
  const state = { done: false, error: undefined }
  promise.then(
    () => { state.done = true },
    (error) => { state.done = true; state.error = error }
  )
  return state
}

const storiesError = new Error('stories bulk failed')
const datasourcesError = new Error('index_not_found_exception [base_promo_campaign]')

beforeEach(() => {
  jest.resetAllMocks()
  mockSeedDatabase.mockResolvedValue(undefined)
  mockSeedDatasources.mockResolvedValue(undefined)
  mockCacheInvalidate.mockResolvedValue(undefined)
})

describe('Storyblok sync target', () => {
  it('starts both phases of "all" and invalidates the cache after both finish', async () => {
    const stories = deferred()
    const datasources = deferred()
    mockSeedDatabase.mockReturnValue(stories.promise)
    mockSeedDatasources.mockReturnValue(datasources.promise)

    const state = settled(syncTarget(db, mockConfig, 'all'))
    await flush()

    expect(mockSeedDatabase).toHaveBeenCalledWith(db, mockConfig)
    expect(mockSeedDatasources).toHaveBeenCalledWith(db, mockConfig)
    stories.resolve()
    await flush()
    expect(mockCacheInvalidate).not.toHaveBeenCalled()
    expect(state.done).toBe(false)

    datasources.resolve()
    await flush()
    expect(state).toEqual({ done: true, error: undefined })
    expect(mockCacheInvalidate).toHaveBeenCalledWith(mockConfig.storyblok, 'storyblok')
  })

  it('lets the stories rebuild finish when datasources fail first, then rejects', async () => {
    const stories = deferred()
    mockSeedDatabase.mockReturnValue(stories.promise)
    mockSeedDatasources.mockRejectedValue(datasourcesError)

    const state = settled(syncTarget(db, mockConfig, 'all'))
    await flush()
    expect(state.done).toBe(false)
    expect(mockCacheInvalidate).not.toHaveBeenCalled()

    stories.resolve()
    await flush()
    expect(state).toEqual({ done: true, error: datasourcesError })
    expect(mockCacheInvalidate).toHaveBeenCalledWith(mockConfig.storyblok, 'storyblok')
  })

  it('waits for datasources when stories fail and keeps the cache', async () => {
    const datasources = deferred()
    mockSeedDatabase.mockRejectedValue(storiesError)
    mockSeedDatasources.mockReturnValue(datasources.promise)

    const state = settled(syncTarget(db, mockConfig, 'all'))
    await flush()
    expect(state.done).toBe(false)

    datasources.resolve()
    await flush()
    expect(state).toEqual({ done: true, error: storiesError })
    expect(mockCacheInvalidate).not.toHaveBeenCalled()
  })

  it('reports every failure when both phases fail', async () => {
    mockSeedDatabase.mockRejectedValue(storiesError)
    mockSeedDatasources.mockRejectedValue(datasourcesError)

    const error = await syncTarget(db, mockConfig, 'all').catch(e => e)

    expect(error.message).toBe('Storyblok sync failed: stories, datasources')
    expect(error.errors).toEqual([storiesError, datasourcesError])
    expect(mockCacheInvalidate).not.toHaveBeenCalled()
  })

  it('reports a cache invalidation failure together with a datasource failure', async () => {
    const cacheError = new Error('cache unavailable')
    mockSeedDatasources.mockRejectedValue(datasourcesError)
    mockCacheInvalidate.mockRejectedValue(cacheError)

    const error = await syncTarget(db, mockConfig, 'all').catch(e => e)

    expect(error.message).toBe('Storyblok sync failed: datasources, cache invalidation')
    expect(error.errors).toEqual([datasourcesError, cacheError])
  })

  it('rejects with a cache invalidation failure after successful phases', async () => {
    const cacheError = new Error('cache unavailable')
    mockCacheInvalidate.mockRejectedValue(cacheError)

    await expect(syncTarget(db, mockConfig, 'stories')).rejects.toBe(cacheError)
  })

  it.each([
    ['stories', mockSeedDatabase, mockSeedDatasources],
    ['datasources', mockSeedDatasources, mockSeedDatabase]
  ])('runs only the %s phase and invalidates the cache on success', async (target, phase, otherPhase) => {
    await syncTarget(db, mockConfig, target)

    expect(phase).toHaveBeenCalledWith(db, mockConfig)
    expect(otherPhase).not.toHaveBeenCalled()
    expect(mockCacheInvalidate).toHaveBeenCalledWith(mockConfig.storyblok, 'storyblok')
  })

  it.each([
    ['stories', mockSeedDatabase, storiesError],
    ['datasources', mockSeedDatasources, datasourcesError]
  ])('propagates a %s failure without cache invalidation', async (target, phase, error) => {
    phase.mockRejectedValue(error)

    await expect(syncTarget(db, mockConfig, target)).rejects.toBe(error)
    expect(mockCacheInvalidate).not.toHaveBeenCalled()
  })

  it.each([undefined, 'catalog', 'constructor'])('rejects target %s without running phases', async (target) => {
    await expect(syncTarget(db, mockConfig, target)).rejects.toThrow(
      '"target" option should be specified. Available options: all, stories, datasources'
    )
    expect(mockSeedDatabase).not.toHaveBeenCalled()
    expect(mockSeedDatasources).not.toHaveBeenCalled()
    expect(mockCacheInvalidate).not.toHaveBeenCalled()
  })
})

describe('storyblok sync CLI', () => {
  const argv = process.argv
  let exit: jest.SpyInstance

  const run = (target?: string) => {
    const code = new Promise<number>(resolve => {
      exit = jest.spyOn(process, 'exit').mockImplementation(((value: number) => resolve(value)) as any)
    })
    process.argv = ['node', 'storyblok.js', 'sync', ...(target ? [`--target=${target}`] : [])]
    jest.isolateModules(() => {
      require('../../../../../../scripts/storyblok')
    })
    return code
  }

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    process.argv = argv
    jest.restoreAllMocks()
  })

  it('exits 0 after a successful "all" sync', async () => {
    expect(await run('all')).toBe(0)
    expect(mockCacheInvalidate).toHaveBeenCalledTimes(1)
  })

  it('does not exit before the stories rebuild finishes when datasources fail', async () => {
    const stories = deferred()
    mockSeedDatabase.mockReturnValue(stories.promise)
    mockSeedDatasources.mockRejectedValue(datasourcesError)

    const code = run('all')
    await flush()
    expect(exit).not.toHaveBeenCalled()

    stories.resolve()
    expect(await code).toBe(1)
    expect(exit).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith(datasourcesError)
  })

  it('exits 1 when the stories target fails', async () => {
    mockSeedDatabase.mockRejectedValue(storiesError)

    expect(await run('stories')).toBe(1)
    expect(mockSeedDatasources).not.toHaveBeenCalled()
    expect(exit).toHaveBeenCalledTimes(1)
  })

  it.each([undefined, 'catalog'])('exits 1 for target %s without running phases', async (target) => {
    expect(await run(target)).toBe(1)
    await flush()
    expect(exit).toHaveBeenCalledTimes(1)
    expect(mockSeedDatabase).not.toHaveBeenCalled()
    expect(mockSeedDatasources).not.toHaveBeenCalled()
  })
})
