import AbstractCartProxy from '../abstract/cart';
import { multiStoreConfig } from './util';

class CartProxy extends AbstractCartProxy {
  constructor (config, req) {
    const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }
  create (customerToken, userAgent, campaignToken = undefined) {
    return this.api.cart.create(customerToken, userAgent, campaignToken);
  }
  update (customerToken, cartId, cartItem, userAgent) {
    return this.api.cart.update(customerToken, cartId, cartItem, userAgent);
  }
  delete (customerToken, cartId, cartItem, userAgent) {
    return this.api.cart.delete(customerToken, cartId, cartItem, userAgent);
  }
  pull (customerToken, cartId, params, userAgent) {
    return this.api.cart.pull(customerToken, cartId, params, userAgent);
  }
  totals (customerToken, cartId, params, userAgent) {
    return this.api.cart.totals(customerToken, cartId, params, userAgent);
  }
  getShippingMethods (customerToken, cartId, address, userAgent) {
    return this.api.cart.shippingMethods(customerToken, cartId, address, userAgent);
  }
  getPaymentMethods (customerToken, cartId, userAgent) {
    return this.api.cart.paymentMethods(customerToken, cartId, userAgent);
  }
  setShippingInformation (customerToken, cartId, address, userAgent) {
    return this.api.cart.shippingInformation(customerToken, cartId, address, userAgent);
  }
  collectTotals (customerToken, cartId, shippingMethod, userAgent) {
    return this.api.cart.collectTotals(customerToken, cartId, shippingMethod, userAgent);
  }
  applyCoupon (customerToken, cartId, coupon, userAgent) {
    return this.api.cart.applyCoupon(customerToken, cartId, coupon, userAgent);
  }
  deleteCoupon (customerToken, cartId, userAgent) {
    return this.api.cart.deleteCoupon(customerToken, cartId, userAgent);
  }
  getCoupon (customerToken, cartId, userAgent) {
    return this.api.cart.getCoupon(customerToken, cartId, userAgent);
  }
}

module.exports = CartProxy;
