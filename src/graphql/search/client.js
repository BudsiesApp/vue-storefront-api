import config from 'config';
import opensearch from '../../lib/opensearch'

export default opensearch.getClient(config)
