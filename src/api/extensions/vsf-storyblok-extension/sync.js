import { storyblokClient } from './storyblok'
import { storyblokManagementClient } from './storyblok'
import { log, createIndex, createBulkOperations, transformStory, cacheInvalidate } from './helpers'

function indexStories ({ db, stories = [] }) {
  const bulkOps = createBulkOperations(stories)
  return db.bulk({
    body: bulkOps
  })
}

async function syncStories ({ db, page = 1, perPage = 100, languages = [] }) {
  let { data: { stories }, total } = await storyblokClient.get('cdn/stories', {
    page,
    per_page: perPage,
    resolve_links: 'url',
    resolve_relations: 'blockReference.reference',
    excluding_slugs: 'blocks/*'
  })

  for (let language of languages) {
    const response = await storyblokClient.get('cdn/stories', {
      page,
      per_page: perPage,
      resolve_links: 'url',
      resolve_relations: 'blockReference.reference',
      excluding_slugs: 'blocks/*',
      starts_with: language + '/*'
    })

    stories.push(...response.data.stories)
  }

  const newStories = stories.map(story => ({
    ...story,
    full_slug: story.full_slug.replace(/^\/|\/$/g, '')
  }))

  const promise = indexStories({ db, stories: newStories })

  const lastPage = Math.ceil((total / perPage))

  if (page < lastPage) {
    page += 1
    return syncStories({ db, page, perPage })
  }

  return promise
}

const fullSync = async (db, config) => {
  log('Syncing published stories!')
  await db.indices.delete({ ignore_unavailable: true, index: 'storyblok_stories' })
  await db.indices.create(createIndex(config))
  const languages = config.storeViews.multistore ? config.storeViews.mapStoreUrlsFor : [];
  await syncStories({ db, perPage: config.storyblok.perPage, languages })
}

const handleHook = async (db, config, params) => {
  const cv = Date.now() // bust cache
  const { story_id: id, action } = params

  switch (action) {
    case 'published':
      const { data: { story } } = await storyblokClient.get(`cdn/stories/${id}`, {
        cv,
        resolve_links: 'url'
      })
      const publishedStory = transformStory(story)

      await db.index(publishedStory)
      log(`Published ${story.full_slug}`)
      break

    case 'unpublished':
      const unpublishedStory = transformStory({ id })
      await db.delete(unpublishedStory)
      log(`Unpublished ${id}`)
      break

    case 'branch_deployed':
      await fullSync(db, config)
      break
    default:
      break
  }
  await cacheInvalidate(config.storyblok)
}

const seedDatabase = async (db, config) => {
  try {
    await db.ping()
    await fullSync(db, config)
    log('Stories synced!')
  } catch (error) {
    log('Stories not synced!')
    log(error)
  }
}

const seedStoryblokDatasources = async (db, config) => {
  try {
    if (!config.storyblok.sync.enabled) {
      log('Syncing of Storyblok Datasources is disabled!')
      return
    }

    log('Syncing Storyblok Datasources!')

    await db.ping()

    const { body: { hits: { hits: products } } } = await db.search({
      index: config.storyblok.sync.index,
      type: 'product',
      sort: 'name: asc',
      body: {
        "query": {
          "constant_score": {
            "filter": {
              "bool": {
                "must": [
                  {"terms": {"visibility": [2,3,4]}},
                  {"terms": {"status": [1]}}
                ]
              }
            }
          }
        }
      }
    });

    const { body: { hits: { hits: categories } } } = await db.search({
      index: config.storyblok.sync.index,
      type: 'category',
      sort: 'name: asc',
      body: {
        "query": {
          "constant_score": {
            "filter": {
              "bool": {
                "must": [
                  {"term": {"is_active": true}}
                ]
              }
            }
          }
        }
      }
    });

    const datasourcesResponse = await storyblokManagementClient.get(`spaces/${config.storyblok.spaceId}/datasources`)

    let categoriesDatasourceId
    let productsDatasourceId

    for (const datasource of datasourcesResponse.data.datasources) {
      if (datasource.slug === config.storyblok.sync.categoriesDatasourceSlug) {
        categoriesDatasourceId = datasource.id
      }
      if (datasource.slug === config.storyblok.sync.productsDatasourceSlug) {
        productsDatasourceId = datasource.id
      }
    }

    if (!categoriesDatasourceId || !productsDatasourceId) {
      throw new Error('Fail to retrieve datasources IDs')
    }

    await Promise.all([
      storyblokManagementClient.delete(`spaces/${config.storyblok.spaceId}/datasources/${categoriesDatasourceId}`),
      storyblokManagementClient.delete(`spaces/${config.storyblok.spaceId}/datasources/${productsDatasourceId}`)
    ])

    let newCategoriesDatasourceResponse = await storyblokManagementClient.post(`spaces/${config.storyblok.spaceId}/datasources`, {
      datasource: { 
        name: 'Categories', 
        slug: config.storyblok.sync.categoriesDatasourceSlug 
      }
    })

    let newProductsDatasourceResponse = await storyblokManagementClient.post(`spaces/${config.storyblok.spaceId}/datasources`, {
      datasource: { 
        name: 'Products', 
        slug: config.storyblok.sync.productsDatasourceSlug 
      }
    })

    let requests = [];

    for (const category of categories) {
      requests.push(
        storyblokManagementClient.post(`spaces/${config.storyblok.spaceId}/datasource_entries`, {
          datasource_entry: { 
            name: category._source.name, 
            value: category._source.slug,
            datasource_id: newCategoriesDatasourceResponse.data.datasource.id
          }
        })
      )
    }

    for (const product of products) {
      requests.push(storyblokManagementClient.post(`spaces/${config.storyblok.spaceId}/datasource_entries`, {
          datasource_entry: { 
            name: product._source.name, 
            value: product._source.slug,
            datasource_id: newProductsDatasourceResponse.data.datasource.id
          }
        })
      )
    }

    await Promise.all(requests);

    log('Storyblok Datasources synced!')
  } catch (error) {
    log('Storyblok Datasources not synced!')
    log(error)
  }
}

export { syncStories, fullSync, handleHook, seedDatabase, seedStoryblokDatasources }
