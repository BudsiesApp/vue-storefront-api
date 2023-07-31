import BridgeRequestsCache from '../../../helpers/bridgeRequestsCache';
import { apiStatus, getToken } from '../../../lib/util';
import { Router } from 'express';
import { multiStoreConfig } from '../../../platform/magento1/util';

const Magento1Client = require('magento1-vsbridge-client').Magento1Client

const backendSettingsRequestCacheKey = 'backend_settings';

module.exports = ({ config, db }) => {
  function getResponse (data) {
    if (data.code === 200) {
      return data.result;
    }

    return false;
  }

  let budsiesApi = Router();
  let bridgeRequestsCache = BridgeRequestsCache({ db })

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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
    });
  });

  budsiesApi.get('/plushies/body-parts', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getPlushiesBodyParts = function () {
        const customerToken = getToken(req);

        let url = `plushies/bodyParts?token=${customerToken}`;

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

    client.budsies.getPlushiesBodyParts().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, 500);
    });
  });

  budsiesApi.get('/plushies/rush-upgrades', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getPlushiesRushUpgrades = function () {
        const customerToken = getToken(req);

        let url = `plushies/rushUpgrades?token=${customerToken}`;

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

    client.budsies.getPlushiesRushUpgrades().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, 500);
    });
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
    });
  });

  budsiesApi.get('/promotion-platform/quotes-campaigns', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getActivePromotionPlatformCampaign = function () {
        const customerToken = getToken(req);

        let url = `promotionPlatform/quotesCampaigns?token=${customerToken}`;

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

    client.budsies.getActivePromotionPlatformCampaign().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, 500);
    });
  });

  budsiesApi.post('/promotion-platform/active-campaign-update-requests', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.updateActivePromotionPlatformCampaign = function () {
        const customerToken = getToken(req);

        let url = `promotionPlatform/activeCampaignUpdateRequests?token=${customerToken}`;

        const campaignToken = req.query.campaignToken;

        if (campaignToken !== undefined) {
          url += `&campaignToken=${campaignToken}`;
        }

        const data = req.query.data;

        if (data !== undefined) {
          url += `&data=${data}`;
        }

        const cartId = req.query.cartId;

        if (cartId !== undefined) {
          url += `&cartId=${cartId}`;
        }

        return restClient.post(url).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.updateActivePromotionPlatformCampaign().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
    });
  });

  budsiesApi.get('/stores/ratings', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getStoreRating = function () {
        const customerToken = getToken(req);

        let url = `stores/ratings?token=${customerToken}`;

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

    client.budsies.getStoreRating().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
    });
  });

  budsiesApi.get('/bulk-orders/quotes', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getBulkOrderQuotes = function () {
        let url = 'bulkOrders/quotes';

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

    client.budsies.getBulkOrderQuotes().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, 500);
    });
  });

  budsiesApi.post('/bulk-orders/quote-choose', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.chooseBulkOrderQuote = function () {
        const params = new URLSearchParams({
          token: getToken(req),
          cartId: req.query.cartId
        });

        const url = `bulkOrders/quoteChoose?${params.toString()}`;

        return restClient.post(url, req.body).then((data) => {
          return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.chooseBulkOrderQuote().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
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
      apiStatus(res, err, 500);
    });
  });

  return budsiesApi;
}
