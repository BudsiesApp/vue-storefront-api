import config from 'config'
import ProcessorFactory from '../../../processor/factory'

export default function searchResultsProcessor (response, searchRequest, entityType, indexName) {
  return new Promise((resolve, reject) => {
    const factory = new ProcessorFactory(config)
    let resultProcessor = factory.getAdapter(entityType, indexName, searchRequest, response)

    if (!resultProcessor) {
      resultProcessor = factory.getAdapter('default', indexName, searchRequest, response) // get the default processor
    }

    resultProcessor.process(response.body.hits.hits)
      .then((result) => {
        resolve(result)
      })
      .catch((err) => {
        console.error(err)
      })
  })
}
