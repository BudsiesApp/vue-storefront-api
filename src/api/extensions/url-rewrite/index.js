import { Router } from 'express'
import { apiStatus } from '../../../lib/util'
import { getClient } from '../../../lib/opensearch'
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
      apiStatus(res, 'The requestPath query param is required', 400);

      return;
    }

    try {
      const redirect = await getUrlRewriteByRequestPath(db, config, requestPath);

      if (redirect) {
        apiStatus(res, redirect, 200);

        return;
      }

      apiStatus(res, 'Not Found', 404);
    } catch (error) {
      console.error(error);
      apiStatus(res, 'URL rewrite search error', 500);
    }
  })

  return api;
}
