import AbstractUserProxy from '../abstract/user'
import { multiStoreConfig } from './util'

class UserProxy extends AbstractUserProxy {
  constructor (config, req) {
    const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }
  register (userData, userAgent) {
    return this.api.user.create(userData, userAgent)
  }
  login (userData, userAgent) {
    return this.api.user.login(userData, userAgent)
  }
  me (customerToken, userAgent) {
    return this.api.user.me(customerToken, userAgent)
  }
  orderHistory (customerToken, page, pageSize, userAgent) {
    return this.api.user.orderHistory(customerToken, page, pageSize, userAgent)
  }
  creditValue (customerToken, userAgent) {
    return this.api.user.creditValue(customerToken, userAgent)
  }
  refillCredit (customerToken, creditCode, userAgent) {
    return this.api.user.refillCredit(customerToken, creditCode, userAgent)
  }
  resetPassword (emailData, userAgent) {
    return this.api.user.resetPassword(emailData, userAgent)
  }
  update (userData, userAgent) {
    return this.api.user.update(userData, userAgent)
  }
  changePassword (passwordData, userAgent) {
    return this.api.user.changePassword(passwordData, userAgent)
  }
  resetPasswordUsingResetToken (resetData, userAgent) {
    return this.api.user.resetPasswordUsingResetToken(resetData, userAgent)
  }
}

module.exports = UserProxy
