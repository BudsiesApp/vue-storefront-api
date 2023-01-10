import AbstractNewsletterProxy from '../abstract/newsletter';
import { multiStoreConfig } from './util';

class NewsletterProxy extends AbstractNewsletterProxy {
  constructor (config, req) {
    const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }
  subscribe (emailAddress, userAgent) {
    return this.api.newsletter.subscribe(emailAddress, userAgent);
  }
  unsubscribe (customerToken, userAgent) {
    return this.api.newsletter.unsubscribe(customerToken, userAgent);
  }
}

module.exports = NewsletterProxy;
