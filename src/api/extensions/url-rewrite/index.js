import { Router } from 'express'
import { apiStatus } from '../../../lib/util'
import { getClient } from '../../../lib/elastic'
import { getUrlRewriteByRequestPath } from './helpers'

module.exports = ({ config }) => {
  if (!config.extensions.urlRewrite) {
    throw new Error('URL Rewrite module is not configured');
  }

  const db = getClient(config);
  const api = Router();

  if (!config.extensions.urlRewrite.enabled) {
    console.log('URL Rewrite module disabled');

    return api;
  }

  api.get('/redirect', async (req, res) => {
    let requestPath = req.query.requestPath;

    if (!requestPath) {
      throw new Error('The requestPath query param is required');
    }

    const redirect = await getUrlRewriteByRequestPath(db, config, requestPath);

    if (redirect) {
      apiStatus(res, redirect, 200);

      return;
    }

    apiStatus(res, 'Not Found', 404);
  })

  return api;
}
