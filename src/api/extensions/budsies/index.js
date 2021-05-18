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

  budsiesApi.get('/phrase-pillows/size-options', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getPhrasePillowsSizeOptions = function () {
        const customerToken = getToken(req);

        const url = `phrasePillows/sizeOptions?token=${customerToken}`;

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

  return budsiesApi;
}
