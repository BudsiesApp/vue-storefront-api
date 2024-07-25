import BridgeRequestsCache from '../../../helpers/bridgeRequestsCache';
import { apiStatus, getToken } from '../../../lib/util';
import { Router } from 'express';
import { multiStoreConfig } from '../../../platform/magento1/util';
import { getClient } from '../../../lib/elastic';

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

  let budsiesApi = Router();
  let bridgeRequestsCache = BridgeRequestsCache({ db })

  const es = getClient(config);

  budsiesApi.post('/printed-products/cart-items', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.addPrintedProductToCart = function () {
        const customerToken = getToken(req);

        return restClient.post(`printedProducts/cartItems?token=${customerToken}`, req.body).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.addPrintedProductToCart().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/pillows/size-options', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getPhrasePillowsSizeOptions = function () {
        const customerToken = getToken(req);

        const url = `pillows/sizeOptions?token=${customerToken}`;

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getPhrasePillowsSizeOptions().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/phrase-pillows/design-options', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getPhrasePillowsDesignOptions = function () {
        const customerToken = getToken(req);

        let url = `phrasePillows/designOptions?token=${customerToken}`;

        const type = req.query.type;

        if (type !== undefined) {
          url += `&type=${type}`
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getPhrasePillowsDesignOptions().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  })

  budsiesApi.post('/phrase-pillows/cart-items', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.addPhrasePillowToCart = function () {
        const customerToken = getToken(req);

        return restClient.post(`phrasePillows/cartItems?token=${customerToken}`, req.body).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.addPhrasePillowToCart().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/printed-products/designs', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getPrintedProductDesigns = function () {
        const customerToken = getToken(req);

        let url = `printedProducts/designs?token=${customerToken}`;

        const productId = req.query.productId;

        if (productId !== undefined) {
          url += `&productId=${productId}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getPrintedProductDesigns().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/printed-products/extra-photos-addons', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getExtraPhotosAddons = function () {
        const customerToken = getToken(req);

        let url = `printedProducts/extraPhotosAddons?token=${customerToken}`;

        const productId = req.query.productId;

        if (productId !== undefined) {
          url += `&productId=${productId}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getExtraPhotosAddons().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/plushies/extra-photos-upgrades', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getExtraPhotosUpgrades = function () {
        const customerToken = getToken(req);

        let url = `plushies/extraPhotosUpgrades?token=${customerToken}`;

        const productId = req.query.productId;

        if (productId !== undefined) {
          url += `&productId=${productId}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getExtraPhotosUpgrades().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/plushies/short-codes', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getShortCodes = function () {
        const customerToken = getToken(req);

        let url = `plushies/shortCodes?token=${customerToken}`;

        const plushieId = req.query.plushieId;

        if (plushieId !== undefined) {
          url += `&plushieId=${plushieId}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getShortCodes().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/plushies/breeds', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getDogBreeds = function () {
        const customerToken = getToken(req);

        let url = `plushies/dogBreeds?token=${customerToken}`;

        const term = req.query.term;

        if (term !== undefined) {
          url += `&term=${term}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getDogBreeds().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/plushies/upgrades', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getPlushiesUpgrades = function () {
        const customerToken = getToken(req);

        let url = `plushies/upgrades?token=${customerToken}`;

        const productId = req.query.productId;

        if (productId !== undefined) {
          url += `&productId=${productId}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getPlushiesUpgrades().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/plushies/body-parts', async (req, res) => {
    if (req.query.productId === undefined) {
      apiStatus(res, 'The field productId is required', 400);
    }

    const query = {
      index: config.elasticsearch.index,
      type: 'bodypart',
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

      const bodyparts = hits.hits.map((hit) => {
        delete hit._source.tsk;
        return hit._source;
      });

      apiStatus(res, bodyparts);
    } catch (error) {
      console.log(error);
      apiStatus(res, error.toString(), error.code);
    }
  });

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

  budsiesApi.post('/plushies', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.createPlushie = function () {
        const customerToken = getToken(req);

        return restClient.post(`plushies?token=${customerToken}`, req.body).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.createPlushie().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/plushies/body-parts-plushie-values', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getBodyPartsPlushieValues = function () {
        const customerToken = getToken(req);

        let url = `plushies/bodyPartsPlushieValues?token=${customerToken}`;

        const plushieId = req.query.plushieId;

        if (plushieId !== undefined) {
          url += `&plushieId=${plushieId}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getBodyPartsPlushieValues().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/plushies/images', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getPlushieImages = function () {
        const customerToken = getToken(req);

        let url = `plushies/images?token=${customerToken}`;

        const plushieId = req.query.plushieId;

        if (plushieId !== undefined) {
          url += `&plushieId=${plushieId}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getPlushieImages().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/plushies/upgrades-plushie-values', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getSelectedUpgrades = function () {
        const customerToken = getToken(req);

        let url = `plushies/upgradesPlushieValues?token=${customerToken}`;

        const plushieId = req.query.plushieId;

        if (plushieId !== undefined) {
          url += `&plushieId=${plushieId}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getSelectedUpgrades().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/plushies/:plushieId', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getPlushies = function () {
        const customerToken = getToken(req);

        const plushieId = req.params.plushieId;
        let url = `plushies/${plushieId}?token=${customerToken}`;

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getPlushies().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/carts/email-update-requests', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.addPrintedProductToCart = function () {
        const params = new URLSearchParams({
          cartId: req.query.cartId,
          token: getToken(req)
        });

        return restClient.post(`carts/emailUpdateRequests?${params.toString()}`, req.body).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.addPrintedProductToCart().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/dongler-book-requests', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendDonglerBookRequest = function () {
        const customerToken = getToken(req);

        return restClient.post(`donglerBooks/requests/?token=${customerToken}`, req.body).then((data) => {
          return getResponse(data);
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
        const queryParams = {};
       
        const campaignToken = req.query.campaignToken;

        if (campaignToken !== undefined) {
          queryParams['campaignToken'] = campaignToken;
        }

        const data = req.query.data;

        if (data !== undefined) {
          queryParams['data'] = data;
        }

        const cartId = req.query.cartId;

        if (cartId !== undefined) {
          queryParams['cartId'] = cartId;
        }

        return restClient.post(url, queryParams, customerToken).then(data => {
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
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendCartRecoveryRequest = function () {
        const params = new URLSearchParams({
          recoveryId: req.query.recoveryId,
          recoveryCode: req.query.recoveryCode,
          token: getToken(req)
        });

        return restClient.post(`carts/recoveryRequests?${params.toString()}`, req.body).then((data) => {
          return getResponse(data);
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

  budsiesApi.get('/stores/ratings', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getStoreRating = async function () {
        const storeId = req.query.storeId;

        let cacheKey = storeRatingRequestCacheKey;

        if (storeId !== undefined) {
          cacheKey += `_${storeId}`;
        }

        const cachedData = await bridgeRequestsCache.get(cacheKey);

        if (cachedData) {
          return cachedData;
        }

        const customerToken = getToken(req);

        let url = `stores/ratings?token=${customerToken}`;

        if (storeId !== undefined) {
          url += `&storeId=${storeId}`;
        }

        const data = await restClient.get(url);

        const responseData = getResponse(data);

        if (responseData) {
          await bridgeRequestsCache.setWithTtl(cacheKey, responseData, 300);
        } else {
          await bridgeRequestsCache.del(cacheKey);
        }

        return responseData;
      }

      return module;
    });

    client.budsies.getStoreRating().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/giftcards/templates', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getGiftcardsTemplates = function () {
        const customerToken = getToken(req);

        let url = `giftcards/templates?token=${customerToken}`;

        const storeId = req.query.storeId;

        if (storeId !== undefined) {
          url += `&storeId=${storeId}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getGiftcardsTemplates().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/giftcards/apply', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendGiftcardsApplyRequest = function () {
        const customerToken = getToken(req);

        let url = `giftcards/apply?token=${customerToken}`;

        const cartId = req.query.cartId;

        if (cartId !== undefined) {
          url += `&cartId=${cartId}`;
        }

        return restClient.post(url, req.body).then((data) => {
          return getResponse(data);
        });
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
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendGiftcardsRemoveRequest = function () {
        const customerToken = getToken(req);

        let url = `giftcards/remove?token=${customerToken}`;

        const cartId = req.query.cartId;

        if (cartId !== undefined) {
          url += `&cartId=${cartId}`;
        }

        return restClient.post(url, req.body).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.sendGiftcardsRemoveRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/giftcards/change-value', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendGiftcardsChangeValueRequest = function () {
        const customerToken = getToken(req);

        let url = `giftcards/changeValue?token=${customerToken}`;

        const cartId = req.query.cartId;

        if (cartId !== undefined) {
          url += `&cartId=${cartId}`;
        }

        return restClient.post(url, req.body).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.sendGiftcardsChangeValueRequest().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/giftcards/pull', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendGiftcardsPullRequest = function () {
        const customerToken = getToken(req);

        let url = `giftcards/pull?token=${customerToken}`;

        const cartId = req.query.cartId;

        if (cartId !== undefined) {
          url += `&cartId=${cartId}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
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
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendAffirmGetCheckoutObjectRequest = function () {
        const customerToken = getToken(req);

        let url = `affirm/getCheckoutObject?token=${customerToken}`;

        const cartId = req.query.cartId;

        if (cartId !== undefined) {
          url += `&cartId=${cartId}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
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
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendNewsletterSubscriptionsRequest = function () {
        const customerToken = getToken(req);

        let url = `newsletter/subscriptions?token=${customerToken}`;

        return restClient.post(url, req.body).then((data) => {
          return getResponse(data);
        });
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
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendMailchimpSubscriptionsRequest = function () {
        const customerToken = getToken(req);

        let url = `mailingList/subscriptions?token=${customerToken}`;

        return restClient.post(url, req.body).then((data) => {
          return getResponse(data);
        });
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
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendShareArtistsRequest = function () {
        const customerToken = getToken(req);

        let url = `share/artists?token=${customerToken}`;

        return restClient.post(url, req.body).then((data) => {
          return getResponse(data);
        })
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
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendShareCustomerStoriesRequest = function () {
        let url = `share/customerStories`;

        return restClient.post(url, req.body).then((data) => {
          return getResponse(data);
        })
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
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getSettings = async function () {
        let url = 'settings/retrieve';

        const cachedData = await bridgeRequestsCache.get(backendSettingsRequestCacheKey);

        if (cachedData) {
          return cachedData;
        }

        const data = await restClient.get(url);

        const responseData = getResponse(data);

        if (responseData) {
          await bridgeRequestsCache.setWithTtl(backendSettingsRequestCacheKey, responseData, 300);
        } else {
          await bridgeRequestsCache.del(backendSettingsRequestCacheKey);
        }

        return responseData;
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
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.sendCreditCardProcessingErrorNotifications = function () {
        const params = new URLSearchParams({
          token: getToken(req),
          cartId: req.query.cartId
        });

        let url = `order/creditCardProcessingErrorNotifications?${params.toString()}`

        return restClient.post(url, req.body).then((data) => {
          return getResponse(data);
        });
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
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.createAddress = function () {
        const customerToken = getToken(req);

        return restClient.post(`address/create?token=${customerToken}`, req.body).then((data) => {
          return getResponse(data);
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
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.updateAddress = function () {
        const customerToken = getToken(req);

        return restClient.post(`address/update?token=${customerToken}`, req.body).then((data) => {
          return getResponse(data);
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

  budsiesApi.get('/address/get', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getAddress = function () {
        const customerToken = getToken(req);

        let url = `address/get?token=${customerToken}`;

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getAddress().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/address/list', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.listAddress = function () {
        const customerToken = getToken(req);

        let url = `address/list?token=${customerToken}`;

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.listAddress().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/address/delete', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.deleteAddress = function () {
        const customerToken = getToken(req);

        return restClient.post(`address/delete?token=${customerToken}`, req.body).then((data) => {
          return getResponse(data);
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
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getBulkOrderClientTypes = function () {
        let url = 'bulkOrders/clientTypes';

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getBulkOrderClientTypes().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/bulk-orders/create', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.createBulkOrder = function () {
        return restClient.post('bulkOrders/create', req.body).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.createBulkOrder().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/bulk-orders/info', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getBulkOrderInfo = function () {
        let url = 'bulkOrders/info';

        const bulkOrderId = req.query.bulkOrderId;

        if (bulkOrderId !== undefined) {
          url += `?bulkOrderId=${bulkOrderId}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getBulkOrderInfo().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.get('/bulk-requests/quotes', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getBulkRequestQuotes = function () {
        let url = 'bulkRequests/quotes';

        const bulkRequestId = req.query.bulkRequestId;

        if (bulkRequestId !== undefined) {
          url += `?bulkRequestId=${bulkRequestId}`;
        }

        return restClient.get(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getBulkRequestQuotes().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/bulk-requests/chosen-quotes', (req, res) => {
    const client = Magento2Client(multiStoreConfig(config.magento2.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.chooseBulkRequestQuote = function () {
        const params = new URLSearchParams({
          token: getToken(req),
          cartId: req.query.cartId
        });

        const url = `bulkRequests/chosenQuotes?${params.toString()}`;

        return restClient.post(url, req.body).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.chooseBulkRequestQuote().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, err.code);
    });
  });

  budsiesApi.post('/bulk-orders/question', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.createBulkOrderQuestion = function () {
        return restClient.post('bulkOrders/question', req.body).then((data) => {
          return getResponse(data);
        });
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

  budsiesApi.get('/hospitals', async (req, res) => {
    const query = {
      index: config.elasticsearch.index,
      type: 'hospital',
      body: {
        query: {
          match_all: {}
        }
      }
    };

    try {
      const response = await es.search(query)
      const hits = response.body ? response.body.hits : response.hits;

      if (hits.total === 0) {
        apiStatus(res, 'Not found', 404);

        return;
      }

      const stories = [];

      hits.hits.forEach(hit => {
        stories.push({
          id: hit._source.id,
          name: hit._source.name
        });
      });

      apiStatus(res, stories);
    } catch (error) {
      console.log(error);
      apiStatus(res, error.toString(), error.code);
    }
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

  return budsiesApi;
}
