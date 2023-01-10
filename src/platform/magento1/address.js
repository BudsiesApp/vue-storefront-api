import AbstractAddressProxy from '../abstract/address'
import {multiStoreConfig} from './util';

class AddressProxy extends AbstractAddressProxy {
  constructor (config, req) {
    const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }
  list (customerToken, userAgent) {
    return this.api.address.list(customerToken, userAgent)
  }
  update (customerToken, addressData, userAgent) {
    return this.api.address.update(customerToken, addressData, userAgent);
  }
  get (customerToken, addressId, userAgent) {
    return this.api.address.get(customerToken, addressId, userAgent)
  }
  delete (customerToken, addressData, userAgent) {
    return this.api.address.delete(customerToken, addressData, userAgent)
  }
}

module.exports = AddressProxy
