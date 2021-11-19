import { apiStatus, getToken } from '../../../lib/util';
import { Router } from 'express';
import { multiStoreConfig } from '../../../platform/magento1/util';

const Magento1Client = require('magento1-vsbridge-client').Magento1Client

module.exports = ({ config, db }) => {
  function getResponse(data){
    if(data.code === 200){
        return data.result;
    }

    return false;
  }

  let budsiesApi = Router();

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
          token: getToken(req),
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

  budsiesApi.get('/promotion-platform/campaigns', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getPromotionPlatformCampaign = function () {
        const customerToken = getToken(req);

        let url = `promotionPlatform/campaigns?token=${customerToken}`;

        const campaignToken = req.query.campaignToken;

        if (campaignToken !== undefined) {
          url += `&campaignToken=${campaignToken}`;
        }

        const data = req.query.data;

        if (data !== undefined) {
            url += `&data=${data}`;
        }

        return restClient.get(url).then((data) => {
            return getResponse(data);
        });
      }

      return module;
    });

    client.budsies.getPromotionPlatformCampaign().then((result) => {
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
          token: getToken(req),
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

  return budsiesApi;
}
