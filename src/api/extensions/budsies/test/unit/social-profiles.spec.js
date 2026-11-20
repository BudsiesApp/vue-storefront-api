import { getClient, adjustIndexName } from '../../../../../lib/opensearch';
const createRouter = require('../../index');

jest.mock('../../../../../lib/opensearch', () => {
  const actual = jest.requireActual('../../../../../lib/opensearch');
  return { ...actual, getClient: jest.fn() };
});

describe('social profiles endpoint', () => {
  const search = jest.fn();
  let handler;
  let res;
  let log;

  beforeEach(() => {
    search.mockReset();
    getClient.mockReturnValue({ search });
    const router = createRouter({ config: { opensearch: { index: 'store_3' } }, db: {} });
    handler = router.stack.find(layer => layer.route && layer.route.path === '/social-profiles').route.stack[0].handle;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    log = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => log.mockRestore());

  it('searches the configured alias and returns profile fields', async () => {
    const profile = {
      id: 1,
      network: 'x',
      is_enabled: true,
      profile_url: 'https://example.com',
      subscribers_count: 1000,
      display_subscribers: true,
      position: 1
    };
    search.mockResolvedValue({ body: { hits: { hits: [{ _source: profile }] } } });
    await handler({}, res);
    expect(search).toHaveBeenCalledWith({
      index: adjustIndexName('store_3', 'social_profile'),
      size: 50,
      allow_partial_search_results: false,
      _source: [
        'id',
        'network',
        'is_enabled',
        'profile_url',
        'subscribers_count',
        'display_subscribers',
        'position'
      ],
      body: { query: { match_all: {} } }
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 200, result: [profile] });
  });

  it('returns an empty array when there are no hits', async () => {
    search.mockResolvedValue({ body: { hits: { hits: [] } } });
    await handler({}, res);
    expect(res.json).toHaveBeenCalledWith({ code: 200, result: [] });
  });

  it('returns a generic HTTP 500 for a search error without a code', async () => {
    const error = new Error('private upstream address and response');
    error.name = 'ConnectionError';
    search.mockRejectedValue(error);
    await handler({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ code: 500, result: 'Unable to load social profiles' });
    expect(log).toHaveBeenCalledWith('Social profile search failed', {
      errorType: 'ConnectionError',
      statusCode: undefined
    });
  });
});
