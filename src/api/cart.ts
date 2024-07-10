import { Router } from 'express';

import { apiStatus, apiError, getToken } from '../lib/util';
import PlatformFactory from '../platform/factory';
import { multiStoreConfig } from '../platform/magento1/util';

const Magento1Client = require('magento1-vsbridge-client').Magento1Client

export default ({ config, db }) => {
  let cartApi = Router();

  const _getProxy = (req) => {
    const platform = config.platform
    const factory = new PlatformFactory(config, req)
    return factory.getAdapter(platform, 'cart')
  };

  /**
   * POST create a cart
   * req.query.token | req.headers.authorization - user token
   */
  cartApi.post('/create', (req, res) => {
    const cartProxy = _getProxy(req)
    const token = getToken(req)
    cartProxy.create(
      token,
      req.query.campaignToken ? req.query.campaignToken : undefined
    ).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST update or add the cart item
   *   req.query.token | req.headers.authorization - user token
   *   body.cartItem: {
   *    sku: orderItem.sku,
   *    qty: orderItem.qty,
   *   quoteId: cartKey}
   */
  cartApi.post('/update', (req, res) => {
    const cartProxy = _getProxy(req)
    const token = getToken(req)
    if (!req.body.cartItem) {
      return apiStatus(res, 'No cartItem element provided within the request body', 500)
    }

    var cartItem = req.body.cartItem;

    if (cartItem.plushieId) {
      if (!cartItem.extension_attributes) {
        cartItem.extension_attributes = {};
      }

      cartItem.extension_attributes.plushie_id = cartItem.plushieId;

      delete cartItem.plushieId;
    }

    if (cartItem.customizationState) {
      if (!cartItem.extension_attributes) {
        cartItem.extension_attributes = {};
      }

      cartItem.extension_attributes.customization_state = cartItem.customizationState;

      delete cartItem.customizationState;
    }

    cartProxy.update(token, req.query.cartId ? req.query.cartId : null, cartItem).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST apply the coupon code
   *   req.query.token | req.headers.authorization - user token
   *   req.query.cartId - cart Ids
   *   req.query.coupon - coupon
   */
  cartApi.post('/apply-coupon', (req, res) => {
    const cartProxy = _getProxy(req)
    const token = getToken(req)
    if (!req.query.coupon) {
      return apiStatus(res, 'No coupon code provided', 500)
    }
    cartProxy.applyCoupon(token, req.query.cartId ? req.query.cartId : null, req.query.coupon).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST remove the coupon code
   *   req.query.token | req.headers.authorization - user token
   *   req.query.cartId - cart Ids
   */
  cartApi.post('/delete-coupon', (req, res) => {
    const cartProxy = _getProxy(req)
    const token = getToken(req)
    cartProxy.deleteCoupon(token, req.query.cartId ? req.query.cartId : null).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * GET get the applied coupon code
   *   req.query.token | req.headers.authorization - user token
   *   req.query.cartId - cart Ids
   */
  cartApi.get('/coupon', (req, res) => {
    const cartProxy = _getProxy(req)
    const token = getToken(req)
    cartProxy.getCoupon(token, req.query.cartId ? req.query.cartId : null).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST delete the cart item
   *   req.query.token | req.headers.authorization - user token
   *   body.cartItem: {
   *    sku: orderItem.sku,
   *    qty: orderItem.qty,
   *   quoteId: cartKey}
   */
  cartApi.post('/delete', (req, res) => {
    const cartProxy = _getProxy(req)
    const token = getToken(req)
    if (!req.body.cartItem) {
      return apiStatus(res, 'No cartItem element provided within the request body', 500)
    }
    cartProxy.delete(token, req.query.cartId ? req.query.cartId : null, req.body.cartItem).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * GET pull the whole cart as it's currently se server side
   *   req.query.token | req.headers.authorization - user token
   *   req.query.cartId - cartId
   */
  cartApi.get('/pull', (req, res) => {
    const cartProxy = _getProxy(req)
    const token = getToken(req)
    res.setHeader('Cache-Control', 'no-cache, no-store');
    cartProxy.pull(token, req.query.cartId ? req.query.cartId : null, req.body).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * GET totals the cart totals
   *   req.query.token | req.headers.authorization - user token
   *   req.query.cartId - cartId
   */
  cartApi.get('/totals', (req, res) => {
    const cartProxy = _getProxy(req)
    const token = getToken(req)
    res.setHeader('Cache-Control', 'no-cache, no-store');
    cartProxy.totals(token, req.query.cartId ? req.query.cartId : null, req.body).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST /shipping-methods - available shipping methods for a given address
   *   req.query.token | req.headers.authorization - user token
   *   req.query.cartId - cart ID if user is logged in, cart token if not
   *   req.body.address - shipping address object
   */
  cartApi.post('/shipping-methods', (req, res) => {
    const cartProxy = _getProxy(req)
    const token = getToken(req)
    res.setHeader('Cache-Control', 'no-cache, no-store');
    if (!req.body.address) {
      return apiStatus(res, 'No address element provided within the request body', 500)
    }
    cartProxy.getShippingMethods(token, req.query.cartId ? req.query.cartId : null, req.body.address).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * GET /payment-methods - available payment methods
   *   req.query.token | req.headers.authorization - user token
   *   req.query.cartId - cart ID if user is logged in, cart token if not
   */
  cartApi.get('/payment-methods', (req, res) => {
    const cartProxy = _getProxy(req)
    const token = getToken(req)
    res.setHeader('Cache-Control', 'no-cache, no-store');
    cartProxy.getPaymentMethods(token, req.query.cartId ? req.query.cartId : null).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST /shipping-information - set shipping information for collecting cart totals after address changed
   *   req.query.token | req.headers.authorization - user token
   *   req.query.cartId - cart ID if user is logged in, cart token if not
   *   req.body.addressInformation - shipping address object
   */
  cartApi.post('/shipping-information', (req, res) => {
    const cartProxy = _getProxy(req)
    const token = getToken(req)
    res.setHeader('Cache-Control', 'no-cache, no-store');
    if (!req.body.addressInformation) {
      return apiStatus(res, 'No address element provided within the request body', 500)
    }
    cartProxy.setShippingInformation(token, req.query.cartId ? req.query.cartId : null, req.body).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST /collect-totals - collect cart totals after shipping address changed
   *   req.query.token | req.headers.authorization - user token
   *   req.query.cartId - cart ID if user is logged in, cart token if not
   *   req.body.shippingMethod - shipping and payment methods object
   */
  cartApi.post('/collect-totals', (req, res) => {
    const cartProxy = _getProxy(req)
    const token = getToken(req)
    res.setHeader('Cache-Control', 'no-cache, no-store');
    if (!req.body.methods) {
      return apiStatus(res, 'No shipping and payment methods element provided within the request body', 500)
    }
    cartProxy.collectTotals(token, req.query.cartId ? req.query.cartId : null, req.body.methods).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  cartApi.post('/merge-guest-and-customer', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store');
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req));

    client.addMethods('cart', (restClient) => {
      let module: any = {};

      module.mergeGuestAndCustomer = function () {
        const customerToken = getToken(req);

        return restClient
          .post(`cart/mergeGuestAndCustomer?token=${customerToken}&cartId=${req.query.cartId}`)
          .then((data) => {
            return data.code === 200 ? data.result : false;
          })
      }

      return module;
    });

    client.cart.mergeGuestAndCustomer().then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  return cartApi
}
