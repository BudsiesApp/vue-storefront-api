import config from 'config'
import * as redis from './lib/redis'
import * as opensearch from './lib/opensearch'

export default callback => {
  // connect to a database if needed, then pass it to `callback`:
  const dbContext = {
    getRedisClient: () => redis.getClient(config),
    getOpenSearchClient: () => opensearch.getClient(config)
  }
  callback(dbContext);
}
