export default ({ db }) => ({

  set (key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const redisClient = db.getRedisClient();

      redisClient.set(
        key,
        JSON.stringify(value),
        (err) => {
          if (err) {
            reject(err);
          }

          resolve()
        }
      );
    });
  },

  setWithTtl (key: string, value: any, ttl?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const redisClient = db.getRedisClient();

      redisClient.setex(
        key,
        ttl,
        JSON.stringify(value),
        (err) => {
          if (err) {
            reject(err);
          }

          resolve()
        }
      );
    });
  },

  get (key): Promise<any> {
    return new Promise((resolve, reject) => {
      const redisClient = db.getRedisClient();

      redisClient.get(key, (err, cachedData) => {
        if (err) {
          reject(err);
        }

        resolve(cachedData ? JSON.parse(cachedData) : undefined)
      });
    });
  },

  del (key): Promise<void> {
    return new Promise((resolve, reject) => {
      const redisClient = db.getRedisClient();

      redisClient.del(key,
        (err) => {
          if (err) {
            reject(err);
          }

          resolve()
        }
      );
    })
  }
})
