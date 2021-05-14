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

  return budsiesApi;
}
