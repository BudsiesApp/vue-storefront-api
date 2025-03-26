import Redis from 'redis'

/**
 * Return Redis Client
 * @param {config} config
 */
let globalRedisClient = null

function createClient (config) {
  if (globalRedisClient) {
    globalRedisClient.quit();
    globalRedisClient = null;
  }

  globalRedisClient = Redis.createClient(config.redis);

  globalRedisClient.on('error', (err) => { // workaround for https://github.com/NodeRedis/node_redis/issues/713
    console.log('ERROR', err);
  });

  globalRedisClient.on('end', () => {
    createClient(config);
  });

  if (config.redis.auth) {
    globalRedisClient.auth(config.redis.auth);
  }

  return globalRedisClient;
}

export function getClient (config) {
  if (globalRedisClient) {
    return globalRedisClient;
  }

  return createClient(config);
}
