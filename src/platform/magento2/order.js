import AbstractOrderProxy from '../abstract/order'
import { multiStoreConfig } from './util'
import { processSingleOrder } from './o2m'

class OrderProxy extends AbstractOrderProxy {
  constructor (config, req) {
    const Magento2Client = require('magento2-rest-client').Magento2Client;
    super(config, req)
    this.config = config
    this.api = Magento2Client(multiStoreConfig(config.magento2.api, req));
  }

  create (orderData, customerToken) {
    const inst = this
    return new Promise((resolve, reject) => {
      try {
        processSingleOrder(
          orderData,
          inst.config,
          null,
          (error, result) => {
            console.log(error)
            if (error) reject(error)
            resolve(result)
          },
          customerToken
        )
      } catch (e) {
        reject(e)
      }
    })
  }
}

module.exports = OrderProxy
