import AbstractWishlistProxy from '../abstract/wishlist';
import { multiStoreConfig } from './util';

class WishlistProxy extends AbstractWishlistProxy {
  constructor (config, req) {
    const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }
  pull (customerToken, userAgent) {
    return this.api.wishlist.pull(customerToken, userAgent);
  }
  update (customerToken, wishListItem, userAgent) {
    return this.api.wishlist.update(customerToken, wishListItem, userAgent);
  }
  delete (customerToken, wishListItem, userAgent) {
    return this.api.wishlist.delete(customerToken, wishListItem, userAgent);
  }
}

module.exports = WishlistProxy;
