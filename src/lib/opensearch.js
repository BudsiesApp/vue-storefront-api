const { Client } = require('@opensearch-project/opensearch')
const querystring = require('querystring')

function adjustIndexName (indexName, entityType) {
  return `${indexName}_${entityType}`
}

function fieldList (values) {
  const fields = [].concat(values || []).reduce((fields, value) => fields.concat(value.split(',')), [])
  return [...new Set(fields.map(field => field.trim()).filter(Boolean))]
}

function adjustBackendProxyUrl (req, indexName, entityType, config) {
  const settings = config.opensearch
  const queryStart = req.url.indexOf('?')
  const params = querystring.parse(queryStart < 0 ? '' : req.url.slice(queryStart + 1))
  const blacklist = settings.useRequestFilter ? settings.requestParamsBlacklist : []
  const entity = config.entities[entityType]
  const sourceParams = {}

  for (const family of ['include', 'exclude']) {
    const singular = `_source_${family}`
    const plural = `${singular}s`
    const blocked = blacklist.includes(singular) || blacklist.includes(plural)
    let fields = blocked ? [] : fieldList([].concat(params[singular] || [], params[plural] || []))
    if (settings.useRequestFilter && entity) {
      const configured = fieldList(entity[`${family}Fields`])
      fields = settings.overwriteRequestSourceParams ? configured : [...new Set([...configured, ...fields])]
    }
    delete params[singular]
    delete params[plural]
    if (fields.length) sourceParams[plural] = fields.join(',')
  }

  for (const key of [...blacklist, 'request', 'request_format', 'response_format', 'x-app-version', 'x-instance-id', 'type', 'source', 'source_content_type']) {
    delete params[key]
  }
  Object.assign(params, sourceParams, { track_total_hits: true })
  if (settings.cacheRequest) params.request_cache = true
  const alias = encodeURIComponent(adjustIndexName(indexName, entityType))
  return `${settings.protocol}://${settings.host}:${settings.port}/${alias}/_search?${querystring.stringify(params)}`
}

function adjustQuery (query, entityType) {
  query.index = adjustIndexName(query.index, entityType)
  delete query.type
  return query
}

function getHits (result) {
  return result.body.hits.hits
}

function getTotal (total) {
  return typeof total === 'number' ? total : total?.value || 0
}

let client = null
function getClient (config) {
  if (!client) {
    const { host, port, protocol, requestTimeout, user, password } = config.opensearch
    const node = `${protocol}://${host}:${port}`
    const auth = user ? { username: user, password } : undefined
    client = new Client({ node, auth, requestTimeout })
  }
  return client
}

module.exports = {
  adjustQuery,
  adjustBackendProxyUrl,
  getClient,
  getHits,
  getTotal,
  adjustIndexName
}
