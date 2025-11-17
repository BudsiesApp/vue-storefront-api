import BridgeRequestsCache from '../../../helpers/bridgeRequestsCache';
import { apiStatus, getToken } from '../../../lib/util';
import { Router } from 'express';
import { multiStoreConfig } from '../../../platform/magento1/util';
import { getClient } from '../../../lib/elastic';
import PlatformFactory from '../../../platform/factory';
import { updateUserAddresses } from '../../user';
import axios from 'axios';

const Magento1Client = require('magento1-vsbridge-client').Magento1Client
const Magento2Client = require('magento2-rest-client').Magento2Client

const backendSettingsRequestCacheKey = 'backend_settings';
const storeRatingRequestCacheKey = 'store_rating';

module.exports = ({ config, db }) => {
  function getResponse (data) {
    if (data.code === 200) {
      return data.result;
    }

    return false;
  }

  const _getUserProxy = (req) => {
    const platform = config.platform
    const factory = new PlatformFactory(config, req)
    return factory.getAdapter(platform, 'user')
  };

  let budsiesApi = Router();
  let bridgeRequestsCache = BridgeRequestsCache({ db })

  const es = getClient(config);

  budsiesApi.get('/plushies/rush-upgrades', async (req, res) => {
    if (req.query.productId === undefined) {
      apiStatus(res, 'The field productId is required', 400);
    }

    const query = {
      index: config.elasticsearch.index,
      type: 'rush_upgrade',
      body: {
        query: {
          terms: {
            'product_id': Array.isArray(req.query.productId) ? req.query.productId : [req.query.productId]
          }
        }
      }
    };

    try {
      const response = await es.search(query)
      const hits = response.body ? response.body.hits : response.hits;

      const rushUpgrades = hits.hits.map((hit) => {
        delete hit._source.tsk;
        return hit._source;
      });

      apiStatus(res, rushUpgrades);
    } catch (error) {
      console.log(error);
      apiStatus(res, error.toString(), error.code);
    }
  });

  budsiesApi.get('/plushies/products-rush-upgrades', async (req, res) => {
    const query = {
      index: config.elasticsearch.index,
      type: 'rush_upgrade',
      size: 1000,
      body: {
        query: {
          match_all: {}
        }
      }
    };

    try {
      const response = await es.search(query)
      const hits = response.body ? response.body.hits : response.hits;

      const rushUpgrades = {};

      hits.hits.forEach((hit) => {
        const productId = hit._source.product_id;

        if (rushUpgrades[productId] === undefined) {
          rushUpgrades[productId] = [];
        }

        delete hit._source.tsk;
        rushUpgrades[productId].push(hit._source);
      });

      apiStatus(res, rushUpgrades);
    } catch (error) {
      console.log(error);
      apiStatus(res, error.toString(), error.code);
    }
  });

  budsiesApi.post('/dongler-book-requests', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendDonglerBookRequest = function () {
        const customerToken = getToken(req);

        return restClient.post(`/dongler_books_requests`, req.body, customerToken).then((data) => {
          if (data === 'success') {
            data = true;
          }

          return data;
        });
      }

      return module;
    });

    client.budsies.sendDonglerBookRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/promotion-platform/campaigns/default', async (req, res) => {
    const query = {
      index: config.elasticsearch.index,
      type: 'default_promotion_campaign',
      body: {
        query: {
          match_all: {}
        }
      }
    };

    try {
      const response = await es.search(query)
      const hits = response.body ? response.body.hits : response.hits;

      if (!hits.hits.length) {
        apiStatus(res, false);
        return;
      }

      const campaigns = hits.hits.map((hit) => {
        delete hit._source.tsk;
        return hit._source;
      });

      apiStatus(res, campaigns[0]);
    } catch (error) {
      apiStatus(res, error.toString(), error.code);
    }
  });

  budsiesApi.get('/promotion-platform/quotes-campaigns', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getActivePromotionPlatformCampaign = function () {
        const customerToken = getToken(req);

        let url = `/promotionPlatform/quotesCampaigns`;
        const queryParams = new URLSearchParams();

        const cartId = req.query.cartId;

        if (cartId !== undefined) {
          queryParams.append('cartId', cartId);
        }

        if (queryParams.toString() !== '') {
          url += '?' + queryParams.toString();
        }

        return restClient.get(url, customerToken).then((data) => {
          if (Array.isArray(data)) {
            return data[0];
          }

          return data;
        });
      }

      return module;
    });

    client.budsies.getActivePromotionPlatformCampaign().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/promotion-platform/active-campaign-update-requests', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.updateActivePromotionPlatformCampaign = function () {
        const customerToken = getToken(req);

        let url = `/promotionPlatform/activeCampaignUpdateRequests`;
        const bodyParams = {};

        const campaignToken = req.query.campaignToken;

        if (campaignToken !== undefined) {
          bodyParams['campaignToken'] = campaignToken;
        }

        const data = req.query.data;

        if (data !== undefined) {
          bodyParams['data'] = data;
        }

        const cartId = req.query.cartId;

        if (cartId !== undefined) {
          bodyParams['cartId'] = cartId;
        }

        return restClient.post(url, bodyParams, customerToken).then(data => {
          if (Array.isArray(data)) {
            return data[0];
          }

          return data;
        });
      }

      return module;
    });

    client.budsies.updateActivePromotionPlatformCampaign().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/carts/recovery-requests', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendCartRecoveryRequest = function () {
        const customerToken = getToken(req);

        const bodyParams = {
          key: req.query.recoveryCode,
          currentQuoteId: req.body.quoteId
        };

        return restClient.post(`/carts/recovery-requests`, bodyParams, customerToken).then((data) => {
          return data.quote_id;
        });
      }

      return module;
    });

    client.budsies.sendCartRecoveryRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/carts/personal-details-update-requests', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendCartPersonalDetailsUpdateRequest = function () {
        const customerToken = getToken(req);

        let url = `/carts/personal-details-update-requests`;

        return restClient.post(url, req.body, customerToken);
      }

      return module;
    });

    client.budsies.sendCartPersonalDetailsUpdateRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/stores/ratings', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getStoreRating = async function () {
        const storeId = req.query.storeId;

        let cacheKey = storeRatingRequestCacheKey;

        if (storeId !== undefined) {
          cacheKey += `_${storeId}`;
        }

        try {
          const cachedData = await bridgeRequestsCache.get(cacheKey);

          if (cachedData) {
            return cachedData;
          }
        } catch (error) {
          console.error(error);
        }

        const customerToken = getToken(req);

        let url = `/stores/ratings`;

        if (storeId !== undefined) {
          url += `?storeId=${storeId}`;
        }

        let data = await restClient.get(url, customerToken);

        try {
          if (data) {
            data = { 'storeRating': data[0] };
            await bridgeRequestsCache.setWithTtl(cacheKey, data, 300);
          } else {
            await bridgeRequestsCache.del(cacheKey);
          }
        } catch (error) {
          console.error(error);
        }

        return data;
      }

      return module;
    });

    client.budsies.getStoreRating().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/giftcards/apply', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendGiftcardsApplyRequest = function () {
        const customerToken = getToken(req);

        let url;
        if (customerToken) {
          url = `/carts/mine/gift-card/`;
        } else {
          url = `/guest-carts/${req.query.cartId}/gift-card/`;
        }

        url += req.body.code;

        return restClient.put(url, {}, customerToken);
      }

      return module;
    });

    client.budsies.sendGiftcardsApplyRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/giftcards/remove', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendGiftcardsRemoveRequest = async function () {
        const customerToken = getToken(req);

        let url;
        if (customerToken) {
          url = `/carts/mine/gift-card/bulk-removal-requests/`;
        } else {
          url = `/guest-carts/${req.query.cartId}/gift-card/bulk-removal-requests/`;
        }

        const codes = req.body.codes;

        return restClient.post(url, { codes }, customerToken);
      }

      return module;
    });

    client.budsies.sendGiftcardsRemoveRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/giftcards/pull', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendGiftcardsPullRequest = function () {
        const customerToken = getToken(req);

        let url;
        if (customerToken) {
          url = `/carts/mine/gift-card/applied-cards`;
        } else {
          url = `/guest-carts/${req.query.cartId}/gift-card/applied-cards`;
        }

        return restClient.get(url, customerToken).then((data) => {
          const result = {};
          for (const card of data) {
            result[card.code] = card.amount;
          }

          return result;
        });
      }

      return module;
    });

    client.budsies.sendGiftcardsPullRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/affirm/get-checkout-object', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendAffirmGetCheckoutObjectRequest = function () {
        const customerToken = getToken(req);
        const cartId = req.query.cartId;

        let url = `/affirm/checkout-requests`;

        if (cartId !== undefined) {
          url += `?cartId=${cartId}`;
        }

        return restClient.get(url, customerToken);
      }

      return module;
    });

    client.budsies.sendAffirmGetCheckoutObjectRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/newsletter/subscriptions', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendNewsletterSubscriptionsRequest = function () {
        let bodyParams = req.body;

        if (req.body.email) {
          bodyParams = {
            subscriber: {
              subscriber_email: req.body.email
            }
          };
        }

        let url = `/subscriber`;

        return restClient.post(url, bodyParams);
      }

      return module;
    });

    client.budsies.sendNewsletterSubscriptionsRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/mailing-list-subscriptions', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendMailchimpSubscriptionsRequest = function () {
        const customerToken = getToken(req);

        let url = `/mailingList/subscriptions`;

        return restClient.post(url, req.body, customerToken);
      }

      return module;
    });

    client.budsies.sendMailchimpSubscriptionsRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/share/artists', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendShareArtistsRequest = function () {
        const customerToken = getToken(req);

        let url = `/budsies_artists`;

        return restClient.post(url, req.body, customerToken);
      }

      return module;
    });

    client.budsies.sendShareArtistsRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch((err) => {
      apiStatus(res, err, err.code);
    })
  });

  budsiesApi.post('/share/customer-stories', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendShareCustomerStoriesRequest = function () {
        let url = `/customer_stories`;

        return restClient.post(url, req.body);
      }

      return module;
    });

    client.budsies.sendShareCustomerStoriesRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch((err) => {
      apiStatus(res, err, err.code);
    })
  });

  budsiesApi.get('/settings/retrieve', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getSettings = async function () {
        let url = '/settings';

        try {
          const cachedData = await bridgeRequestsCache.get(backendSettingsRequestCacheKey);

          if (cachedData) {
            return cachedData;
          }
        } catch (error) {
          console.error(error);
        }

        const data = (await restClient.get(url)).shift();

        try {
          if (data) {
            await bridgeRequestsCache.setWithTtl(backendSettingsRequestCacheKey, data, 300);
          } else {
            await bridgeRequestsCache.del(backendSettingsRequestCacheKey);
          }
        } catch (error) {
          console.error(error);
        }

        return data;
      }

      return module;
    });

    client.budsies.getSettings().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/order/creditcard-processing-error-notifications', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendCreditCardProcessingErrorNotifications = function () {
        const customerToken = getToken(req);

        const bodyParams = req.body;
        bodyParams.cartId = req.query.cartId;

        let url = `/paymentErrorHelpRequests`

        return restClient.post(url, bodyParams, customerToken);
      }

      return module;
    });

    client.budsies.sendCreditCardProcessingErrorNotifications().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/order/reorder', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendReorderRequest = function () {
        const params = new URLSearchParams({
          token: getToken(req),
          cartId: req.query.cartId,
          orderId: req.query.orderId
        });

        let url = `order/reorder?${params.toString()}`

        return restClient.post(url, req.body).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.sendReorderRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/address/create', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', () => {
      let module = {};

      module.createAddress = function () {
        const customerToken = getToken(req);
        const userProxy = _getUserProxy(req);

        let existingAddressesIds = [];

        return userProxy.me(customerToken).then((result) => {
          existingAddressesIds = result.addresses.map((address) => address.id);

          return updateUserAddresses(
            customerToken,
            userProxy,
            result,
            [...result.addresses, req.body.address]
          );
        }).then((data) => {
          const addedAddress = data.addresses.find(
            (address) => !existingAddressesIds.includes(address.id)
          );

          return addedAddress;
        });
      }

      return module;
    });

    client.budsies.createAddress().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/address/update', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', () => {
      let module = {};

      module.updateAddress = function () {
        const customerToken = getToken(req);
        const userProxy = _getUserProxy(req);
        const addressForUpdate = req.body.address;

        return userProxy.me(customerToken).then((result) => {
          let isAddressForUpdateFound = false;
          const updatedAddresses = [];

          result.addresses.forEach(
            (address) => {
              if (addressForUpdate.id === address.id) {
                isAddressForUpdateFound = true;
                updatedAddresses.push(addressForUpdate);
                return;
              }

              if (addressForUpdate.default_shipping) {
                address.default_shipping = false;
              }

              if (addressForUpdate.default_billing) {
                address.default_billing = false
              }

              updatedAddresses.push(address);
            }
          );

          if (!isAddressForUpdateFound) {
            const error = {
              code: 404,
              result: 'Not Found'
            }
            throw error;
          }

          return updateUserAddresses(
            customerToken,
            userProxy,
            result,
            updatedAddresses
          );
        }).then((data) => {
          const updatedAddress = data.addresses.find(
            (address) => addressForUpdate.id === address.id
          );

          return updatedAddress;
        });
      }

      return module;
    });

    client.budsies.updateAddress().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/address/delete', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', () => {
      let module = {};

      module.deleteAddress = function () {
        const userProxy = _getUserProxy(req);
        const customerToken = getToken(req);

        return userProxy.me(customerToken).then((result) => {
          const addressToDeleteIndex = result.addresses.findIndex(
            (address) => address.id === req.body.address.id
          );

          if (addressToDeleteIndex === -1) {
            const error = {
              code: 404,
              result: 'Not Found'
            };

            throw error;
          }

          result.addresses.splice(addressToDeleteIndex, 1)

          return updateUserAddresses(
            customerToken,
            userProxy,
            result,
            result.addresses
          );
        }).then(() => {
          return req.body.address.id;
        });
      }

      return module;
    });

    client.budsies.deleteAddress().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/bulk-orders/client-types', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getBulkOrderClientTypes = function () {
        let url = '/bulkRequests/clientTypes';

        return restClient.get(url);
      }

      return module;
    });

    client.budsies.getBulkOrderClientTypes().then((result) => {
      const responseData = {};

      for (let item of result.items) {
        responseData[item.id] = item.name;
      }

      apiStatus(res, responseData, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/bulk-orders/create', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.createBulkOrder = function () {
        const customerToken = getToken(req);

        return restClient.post('/bulkRequests', req.body, customerToken);
      }

      return module;
    });

    client.budsies.createBulkOrder().then((result) => {
      if (result.status_id) {
        result.statusId = result.status_id;
      }

      if (result.main_image) {
        result.mainImage = result.main_image;
      }

      if (result.bulkrequest_product_id) {
        result.bulkorderProductId = result.bulkrequest_product_id;
      }

      apiStatus(res, result.id, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/bulk-orders/info', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getBulkOrderInfo = function () {
        let url = '/bulkRequests/';

        const bulkRequestId = req.query.bulkOrderId;

        if (bulkRequestId !== undefined) {
          url += bulkRequestId;
        }

        return restClient.get(url);
      }

      return module;
    });

    client.budsies.getBulkOrderInfo().then((result) => {
      if (result.status_id) {
        result.statusId = result.status_id;
      }

      if (result.main_image) {
        result.mainImage = result.main_image;
      }

      if (result.bulkrequest_product_id) {
        result.bulkorderProductId = result.bulkrequest_product_id;
      }

      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/bulk-orders/quotes', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getBulkOrderQuotes = function () {
        let url = '/bulkRequests/quotes';

        const bulkRequestId = req.query.bulkOrderId;

        if (bulkRequestId !== undefined) {
          url += `?bulkRequestId=${bulkRequestId}`;
        }

        return restClient.get(url);
      }

      return module;
    });

    client.budsies.getBulkOrderQuotes().then((result) => {
      for (let item of result) {
        if (item.bulkrequest_id) {
          item.bulkorder_id = item.bulkrequest_id;
        }
      }

      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/bulk-orders/quote-choose', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.chooseBulkOrderQuote = function () {
        const customerToken = getToken(req);

        const bodyParams = {
          cartId: req.query.cartId,
          quoteId: req.body.quoteId
        };

        const url = `/bulkRequests/quotes/chosen/`;

        return restClient.post(url, bodyParams, customerToken);
      }

      return module;
    });

    client.budsies.chooseBulkOrderQuote().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/bulk-orders/question', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.createBulkOrderQuestion = function () {
        const bodyParams = req.body;
        if (bodyParams.bulkOrderId) {
          bodyParams.bulkRequestId = bodyParams.bulkOrderId;
        }

        const customerToken = getToken(req);

        return restClient.post('/bulkRequests/questions', bodyParams, customerToken);
      }

      return module;
    });

    client.budsies.createBulkOrderQuestion().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/plushie-reminders', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendPlushieReminderRequest = function () {
        const customerToken = getToken(req);

        return restClient.post(`promotions/plushieReminders/?token=${customerToken}`, req.body).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.sendPlushieReminderRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/inspirationMachine/themes', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getInspirationMachineThemes = function () {
        const customerToken = getToken(req);
        let url = `/inspirationMachine/themes`;

        return restClient.get(url, customerToken);
      }

      return module;
    });

    client.budsies.getInspirationMachineThemes().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/inspirationMachine/extras', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getInspirationMachineExtras = function () {
        const customerToken = getToken(req);
        let url = `/inspirationMachine/extras`;

        return restClient.get(url, customerToken);
      }

      return module;
    });

    client.budsies.getInspirationMachineExtras().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/inspirationMachine/kitRequests', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.inspirationMachineSendKitRequest = function () {
        const customerToken = getToken(req);
        let url = `/inspirationMachine/kitRequests`;

        return restClient.post(url, req.body, customerToken);
      }

      return module;
    });

    client.budsies.inspirationMachineSendKitRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/raffle/participants/:participantId', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getParticipants = function () {
        const customerToken = getToken(req);

        const participantId = req.params.participantId;
        let url = `raffle/participants/${participantId}?token=${customerToken}`;

        const referrerCode = req.query.referrerCode;

        if (referrerCode !== undefined) {
          url += `?referrerCode=${referrerCode}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getParticipants().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/raffle/registrations', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.registerInRaffle = function () {
        return restClient.post('raffle/registrations', req.body).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.registerInRaffle().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/raffle/tokenVerificationRequests', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendTokenVerificationRequest = function () {
        return restClient.post('raffle/tokenVerificationRequests', req.body).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.sendTokenVerificationRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/raffle/states/current', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getCurrentState = function () {
        const customerToken = getToken(req);

        let url = `raffle/currentState?token=${customerToken}`;

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getCurrentState().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/raffle/tickets/winning', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getWinningTicketsList = function () {
        const customerToken = getToken(req);

        let url = `raffle/winningTickets?token=${customerToken}`;

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getWinningTicketsList().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/statistic-values', async (req, res) => {
    if (req.query.metric === undefined) {
      apiStatus(res, 'The field metric is required', 400);
    }

    const query = {
      index: config.elasticsearch.index,
      type: 'statistic_value',
      body: {
        query: {
          match: {
            'metric': req.query.metric
          }
        }
      }
    };

    try {
      const response = await es.search(query)
      const hits = response.body ? response.body.hits : response.hits;

      const metrics = hits.hits.map((hit) => {
        delete hit._source.tsk;
        return hit._source;
      });

      apiStatus(res, metrics);
    } catch (error) {
      console.log(error);
      apiStatus(res, error.toString(), error.code);
    }
  });

  budsiesApi.get('/customers/me/orders', async (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getOrdersHistory = function () {
        const customerToken = getToken(req);
        let url = `/customers/me/orders`;

        return restClient.get(url, customerToken);
      }

      return module;
    });

    client.budsies.getOrdersHistory().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/customers/me/suggested-products/active-orders', async (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getSuggestedProducts = function () {
        const customerToken = getToken(req);
        let url = `/customers/me/suggested-products/active-orders`;

        if (req.query.page_size) {
          url += `?page_size=${req.query.page_size}`;
        }

        return restClient.get(url, customerToken);
      }

      return module;
    });

    client.budsies.getSuggestedProducts().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/carts/me/items/add-from-order-requests', async (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.addFromOrderRequests = function () {
        const customerToken = getToken(req);
        let url = `/carts/me/items/add-from-order-requests`;

        return restClient.post(url, req.body, customerToken);
      }

      return module;
    });

    client.budsies.addFromOrderRequests().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/currencies/list', async (req, res) => {
    const query = {
      index: config.elasticsearch.index,
      type: 'currency',
      size: 1000,
      body: {
        query: {
          match_all: {}
        },
        sort: [
          {
            _uid: {
              order: 'asc'
            }
          }
        ]
      }
    };

    try {
      const response = await es.search(query)
      const hits = response.body ? response.body.hits : response.hits;

      const currencies = hits.hits.map((hit) => ({
        code: hit._id,
        name: hit._source.name,
        symbol: hit._source.currency_symbol
      }));

      apiStatus(res, currencies);
    } catch (error) {
      console.log(error);
      apiStatus(res, error.toString(), error.code);
    }
  });

  budsiesApi.get('/currencies/rates', async (req, res) => {
    const query = {
      index: config.elasticsearch.index,
      type: 'currency_rate',
      body: {
        size: 1000,
        query: {
          bool: {
            must: [
              {
                term: {
                  currency_from: 'USD'
                }
              }
            ],
            must_not: [
              {
                term: {
                  currency_to: 'USD'
                }
              }
            ]
          }
        }
      }
    };

    try {
      const response = await es.search(query)
      const hits = response.body ? response.body.hits : response.hits;

      const rates = hits.hits.map((hit) => {
        delete hit._source.tsk;
        return hit._source;
      });

      apiStatus(res, rates);
    } catch (error) {
      console.log(error);
      apiStatus(res, error.toString(), error.code);
    }
  });

  budsiesApi.post('/customer/authenticate-requests', async (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.customerAuthenticateRequests = function () {
        const customerToken = getToken(req);
        let url = `/customer/authenticate-requests`;

        return restClient.post(url, req.body, customerToken);
      }

      return module;
    });

    client.budsies.customerAuthenticateRequests().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/customer/login-requests', async (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.customerLoginRequests = function () {
        const customerToken = getToken(req);
        let url = `/customer/login-requests`;

        return restClient.post(url, req.body, customerToken);
      }

      return module;
    });

    client.budsies.customerLoginRequests().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/customer/registration-requests', async (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.customerRegistrationRequests = function () {
        const customerToken = getToken(req);
        let url = `/customer/registration-requests`;

        return restClient.post(url, req.body, customerToken);
      }

      return module;
    });

    client.budsies.customerRegistrationRequests().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/customizations/order-items/states', async (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getOrderItemsCustomizationState = function () {
        const customerToken = getToken(req);

        const params = new URLSearchParams({
          orderItemId: req.query.orderItemId
        });

        let url = `/customizations/order-items/states?${params.toString()}`;

        return restClient.get(url, customerToken);
      }

      return module;
    });

    client.budsies.getOrderItemsCustomizationState().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/customizations/order-items/states', async (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.saveOrderItemsCustomizationState = function () {
        const customerToken = getToken(req);

        let url = `/customizations/order-items/states`;

        return restClient.post(url, req.body, customerToken);
      }

      return module;
    });

    client.budsies.saveOrderItemsCustomizationState().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/customizations/order-items/submit-requests', async (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.orderItemsSubmitRequests = function () {
        const customerToken = getToken(req);

        let url = `/customizations/order-items/submit-requests`;

        return restClient.post(url, req.body, customerToken);
      }

      return module;
    });

    client.budsies.orderItemsSubmitRequests().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/customizations/order-items/deliverables', async (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getOrderItemDeliverables = function () {
        const customerToken = getToken(req);
        const orderItemId = req.query.order_item_id;
        const url = `/customizations/order-items/deliverables?order_item_id=${orderItemId}`;

        return restClient.get(url, customerToken);
      }

      return module;
    });

    client.budsies.getOrderItemDeliverables().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/addresses/validate', async (req, res) => {
    const validationApiKey = config.address?.validationApiKey;

    if (!validationApiKey) {
      apiStatus(res, 'Address validation API key is not configured', 500);
      return;
    }

    const apiUrl = `https://addressvalidation.googleapis.com/v1:validateAddress?key=${validationApiKey}`;

    try {
      const response = await axios.post(apiUrl, req.body, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      apiStatus(res, response.data, 200);
    } catch (error) {
      const errorMessage = error.response?.data || error.message;
      const errorCode = error.response?.status || 500;

      console.error('Address validation error:', errorMessage);
      apiStatus(res, errorMessage, errorCode);
    }
  });

  return budsiesApi;
}
