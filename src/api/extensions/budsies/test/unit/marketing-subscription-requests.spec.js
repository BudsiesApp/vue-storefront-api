import { apiStatus } from '../../../../../lib/util';
import { multiStoreConfig } from '../../../../../platform/magento1/util';
import { Magento2Client } from 'magento2-rest-client';

jest.mock('../../../../../helpers/bridgeRequestsCache', () => jest.fn(() => ({})));
jest.mock('../../../../../lib/util', () => ({ apiStatus: jest.fn(), getToken: jest.fn() }));
jest.mock('../../../../../platform/magento1/util', () => ({ multiStoreConfig: jest.fn(() => 'store-config') }));
jest.mock('../../../../../lib/opensearch', () => ({ getClient: jest.fn(() => ({})), adjustIndexName: jest.fn() }));
jest.mock('../../../../../platform/factory', () => jest.fn());
jest.mock('../../../../user', () => ({ updateUserAddresses: jest.fn() }));
jest.mock('magento2-rest-client', () => ({ Magento2Client: jest.fn() }));

const createRouter = require('../../index');

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe('order marketing subscription proxy', () => {
  const config = { magento2: { api: {} } };
  const post = jest.fn();
  let handler;

  beforeEach(() => {
    jest.clearAllMocks();
    Magento2Client.mockImplementation(() => {
      const client = { addMethods: (_, factory) => { client.budsies = factory({ post }); } };
      return client;
    });
    post.mockResolvedValue(true);
    const router = createRouter({ config, db: {} });
    handler = router.stack.find(layer => layer.route && layer.route.path === '/marketing-subscription-requests').route.stack[0].handle;
  });

  it.each([123, '123'])('forwards id %s and whitelisted present fields anonymously', async orderId => {
    const req = { body: { orderId, email: 'test@example.com', emailConsent: false, smsConsent: true, phone: '+14165550123', token: 'ignored', extra: 1 }, query: { storeCode: 'petsies' } };
    const res = {};
    handler(req, res);
    await flushPromises();
    expect(multiStoreConfig).toHaveBeenCalledWith(config.magento2.api, req);
    expect(Magento2Client).toHaveBeenCalledWith('store-config');
    expect(post).toHaveBeenCalledWith('/orders/123/marketing-subscription-requests', { email: 'test@example.com', emailConsent: false, smsConsent: true, phone: '+14165550123' });
    expect(apiStatus).toHaveBeenCalledWith(res, true, 200);
  });

  it('uses the real Magento client to construct a URL with one API version', async () => {
    const requestPath = require.resolve('request', { paths: [require.resolve('magento2-rest-client')] });
    const request = jest.fn((options, callback) => callback(null, { statusCode: 200 }, true));
    jest.doMock(requestPath, () => request);
    const actualClient = jest.requireActual('magento2-rest-client').Magento2Client;
    Magento2Client.mockImplementation(actualClient);
    multiStoreConfig.mockReturnValueOnce({
      url: 'https://example.test/rest/petsies',
      consumerKey: 'test',
      consumerSecret: 'test',
      accessToken: 'test',
      accessTokenSecret: 'test'
    });
    handler({ body: { orderId: '123', emailConsent: true } }, {});
    await flushPromises();
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://example.test/rest/petsies/V1/orders/123/marketing-subscription-requests',
      method: 'POST',
      body: { emailConsent: true }
    }), expect.any(Function));
  });

  it.each([undefined, null, false, {}, [], 0, -1, 1.5, '0', '-1', '1.5', 'abc', '../123'])('rejects invalid id %s before creating a client', orderId => {
    const res = {};
    handler({ body: { orderId } }, res);
    expect(apiStatus).toHaveBeenCalledWith(res, expect.anything(), 400);
    expect(Magento2Client).not.toHaveBeenCalled();
  });

  it('preserves false results and Magento error status', async () => {
    const res = {};
    post.mockResolvedValueOnce(false).mockRejectedValueOnce({ code: 400 });
    handler({ body: { orderId: 1, smsConsent: false } }, res);
    await flushPromises();
    expect(post).toHaveBeenCalledWith(expect.any(String), { smsConsent: false });
    expect(apiStatus).toHaveBeenCalledWith(res, false, 200);
    handler({ body: { orderId: 1 } }, res);
    await flushPromises();
    expect(apiStatus).toHaveBeenCalledWith(res, { code: 400 }, 400);
  });
});
