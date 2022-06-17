import config from 'config';

export default ({ db }) => ({

  set (key: string, value: any): Promise<void> {
    return new Promise((resolve) => {
      const redisClient = db.getRedisClient();

      redisClient.set(
        key,
        (config as any).redis.ttlSeconds,
        JSON.stringify(value),
        () => resolve()
      );
    });
  },

  get (key): Promise<any> {
    return new Promise((resolve) => {
      const redisClient = db.getRedisClient();

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
      const redisClient = db.getRedisClient();

      redisClient.del(key, () => resolve());
    })
  } 
})
