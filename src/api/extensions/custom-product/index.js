import { apiStatus } from '../../../lib/util';
import { Router } from 'express';
import { multiStoreConfig } from '../../../platform/magento1/util';
const Magento1Client = require('magento1-vsbridge-client').Magento1Client

module.exports = ({ config, db }) => {
  let customProductApi = Router();

  customProductApi.get('/create/:type', (req, res) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));
    client.addMethods('customProduct', (restClient) => {
      let module = {};
      module.create = function () {
        console.log(5);
        return restClient.get('customProduct/create/type/' + req.params.type);
      }
      return module;
    })
    client.customProduct.create().then((result) => {
      apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
    }).catch(err => {
      apiStatus(res, err, 500);
    })
  })

  return customProductApi
}
