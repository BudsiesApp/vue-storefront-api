import config from 'config';
import * as redis from '../lib/redis';

const redisClient = redis.getClient(config);

const bridgeRequestsCache = {
  set (key, value): Promise<void> {
    return new Promise((resolve) => {
      redisClient.setex(
        key,
        (config as any).redis.ttlSeconds,
        JSON.stringify(value),
        () => resolve()
      );
    });
  },
  get (key): Promise<any> {
    return new Promise((resolve) => {
      redisClient.get(key, (err, cachedData) => {
        if (err) {
          throw new Error(err);
        }

        resolve(cachedData ? JSON.parse(cachedData) : undefined)
      });
    });
  },
  del (key): Promise<void> {
    return new Promise((resolve) => {
      redisClient.del(key, () => resolve());
    })
  }
}

export default bridgeRequestsCache;
