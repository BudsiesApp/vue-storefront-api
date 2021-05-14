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

        return restClient.post(`printedProducts/create?token=${customerToken}`, req.body).then((data) => {
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

  budsiesApi.get('/printed-products/extra-photos-addons/:productId', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('budsies', (restClient) => {
      let module = {};

      module.getExtraPhotosAddons = function () {
        const customerToken = getToken(req);

        const url = `printedProduct/extraPhotosAddons?token=${customerToken}&productId=${req.params.productId}`;

        return restClient.get(url, req.body).then((data) => {
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

  return budsiesApi;
}
