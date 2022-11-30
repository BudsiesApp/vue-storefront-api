import { storyblokClient } from './storyblok'
import { storyblokManagementClient } from './storyblok'
import { log, createIndex, createBulkOperations, transformStory, cacheInvalidate, getStoriesMatchedToId, getStoriesWithIdReference } from './helpers'

function indexStories ({ db, config, stories = [] }) {
  const bulkOps = createBulkOperations(config.storyblok.storiesIndex, stories)
  return db.bulk({
    body: bulkOps
  })
}

async function indexStory ({ db, config, story }) {
  const transformedStory = transformStory(config.storyblok.storiesIndex, story)

  await db.index(transformedStory)

  log(`Story ${story.full_slug} was indexed`)
}

async function deleteStory ({ db, config, story }) {
  const transformedStory = transformStory(config.storyblok.storiesIndex, story, false)

  await db.delete(transformedStory)

  log(`Story ${story.full_slug} was deleted`)
}

async function syncStories ({ db, config, page = 1, perPage = 100, languages = [] }) {
  let { data: { stories }, total } = await storyblokClient.get('cdn/stories', {
    page,
    per_page: perPage,
    resolve_links: 'url',
    resolve_relations: 'block_reference.reference'
  })

  for (let language of languages) {
    const response = await storyblokClient.get('cdn/stories', {
      page,
      per_page: perPage,
      resolve_links: 'url',
      resolve_relations: 'block_reference.reference',
      starts_with: language + '/*'
    })

    stories.push(...response.data.stories)
  }

  const newStories = stories.map(story => ({
    ...story,
    full_slug: story.full_slug.replace(/^\/|\/$/g, '')
  }))

  const promise = indexStories({ db, config, stories: newStories })

  const lastPage = Math.ceil((total / perPage))

  if (page < lastPage) {
    page += 1
    return syncStories({ db, config, page, perPage })
  }

  return promise
}

const fullSync = async (db, config) => {
  log('Syncing published stories!')
  await db.indices.delete({ ignore_unavailable: true, index: config.storyblok.storiesIndex })
  await db.indices.create(createIndex(config))
  const languages = config.storeViews.multistore ? config.storeViews.mapStoreUrlsFor : [];
  await syncStories({ db, config, perPage: config.storyblok.perPage, languages })
}

const handleHook = async (db, config, params) => {
  const cv = Date.now() // bust cache
  const { story_id: id, action } = params

  if (action === 'branch_deployed') {
    await fullSync(db, config)
    await cacheInvalidate(config.storyblok)
    return
  }

  log(`Handle hook for ${action} story ${id}`)

  try {
    const response = await storyblokManagementClient.get(`spaces/${config.storyblok.spaceId}/stories/${id}`)

    if (response.data.story && response.data.story.is_folder) {
      await fullSync(db, config)
      await cacheInvalidate(config.storyblok)
      return
    }
  } catch (e) {}

  await handleActionForStory(db, config, id, action, cv)
  await handleActionForRelatedStories(db, config, id, action, cv)

  await cacheInvalidate(config.storyblok)
}

const handleActionForRelatedStories = async (db, config, id, action, cv) => {
  const size = 10

  switch (action) {
    case 'deleted':
    case 'unpublished':
      break
    case 'published': {
      let storiesToIndex = await getStoriesWithIdReference(db, config.storyblok.storiesIndex, id)

      while (storiesToIndex.length > 0) {
        const batchStories = storiesToIndex.splice(0, size)
        const batchSlugs = batchStories.map(story => story.full_slug)

        const response = await storyblokClient.get('cdn/stories', {
          cv,
          per_page: size,
          resolve_links: 'url',
          resolve_relations: 'block_reference.reference',
          by_slugs: batchSlugs.join()
        })

        for (const storyToReindex of response.data.stories) {
          log(`Try to reindex story ${storyToReindex.full_slug} with ${id} ID reference`)

          await indexStory({ db, config, story: storyToReindex })
        }
      }

      break
    }
    default: {
      log(`WARNING!!! Unknown action ${action} ${id}`)

      break
    }
  }
}

const handleActionForStory = async (db, config, id, action, cv) => {
  switch (action) {
    case 'published': {
      let storiesToPublish = []

      const response = await storyblokClient.get(`cdn/stories/${id}`, {
        cv,
        resolve_links: 'url',
        resolve_relations: 'block_reference.reference'
      })

      storiesToPublish.push(response.data.story)

      const languages = config.storeViews.multistore ? config.storeViews.mapStoreUrlsFor : [];

      for (let language of languages) {
        const response = await storyblokClient.get(`cdn/stories/${id}`, {
          cv,
          resolve_links: 'url',
          resolve_relations: 'block_reference.reference',
          language: language
        })

        storiesToPublish.push(response.data.story)
      }

      let storiesToDelete = await getStoriesMatchedToId(db, config.storyblok.storiesIndex, id)

      for (const storyToDelete of storiesToDelete) {
        log(`Try to delete old copy of story ${storyToDelete.full_slug}`)

        await deleteStory({ db, config, story: storyToDelete })
      }

      for (const storyToPublish of storiesToPublish) {
        log(`Try to reindex story ${storyToPublish.full_slug}`)

        await indexStory({ db, config, story: storyToPublish })
      }

      break
    }
    case 'unpublished':
    case 'deleted': {
      const stories = await getStoriesMatchedToId(db, config.storyblok.storiesIndex, id)

      for (const storyToDelete of stories) {
        log(`Try to delete story ${storyToDelete.full_slug}`)

        await deleteStory({ db, config, story: storyToDelete });
      }

      break
    }
    default: {
      log(`WARNING!!! Unknown action ${action} ${id}`)

      break
    }
  }
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
      body: {
        'size': 1000,
        'sort': [
          {'name.keyword': 'asc'}
        ],
        'query': {
          'constant_score': {
            'filter': {
              'bool': {
                'must': [
                  {'terms': {'visibility': [2, 3, 4]}}
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
      body: {
        'size': 1000,
        'sort': [
          {'name.keyword': 'asc'}
        ],
        'query': {
          'constant_score': {
            'filter': {
              'bool': {
                'must': [
                  {'term': {'is_active': true}}
                ]
              }
            }
          }
        }
      }
    });

    const { body: { hits: { hits: promoCampaigns } } } = await db.search({
      index: config.storyblok.sync.index,
      type: 'promo_campaign',
      body: {
        'size': 1000,
        'sort': [
          {'name.keyword': 'asc'}
        ],
        'query': {}
      }
    });

    log('Products count: ' + products.length)
    log('Categories count: ' + categories.length)
    log('Promo campaigns count: ' + promoCampaigns.length)

    const datasourcesResponse = await storyblokManagementClient.get(`spaces/${config.storyblok.spaceId}/datasources`)

    let categoriesDatasourceId
    let productsDatasourceId
    let promoCampaignsDatasourceId

    for (const datasource of datasourcesResponse.data.datasources) {
      if (datasource.slug === config.storyblok.sync.categoriesDatasourceSlug) {
        categoriesDatasourceId = datasource.id
      }
      if (datasource.slug === config.storyblok.sync.productsDatasourceSlug) {
        productsDatasourceId = datasource.id
      }
      if (datasource.slug === config.storyblok.sync.promoCampaignsDatasourceSlug) {
        promoCampaignsDatasourceId = datasource.id
      }
    }

    if (!categoriesDatasourceId || !productsDatasourceId || !promoCampaignsDatasourceId) {
      throw new Error('Fail to retrieve datasources IDs')
    }

    await Promise.all([
      storyblokManagementClient.delete(`spaces/${config.storyblok.spaceId}/datasources/${categoriesDatasourceId}`),
      storyblokManagementClient.delete(`spaces/${config.storyblok.spaceId}/datasources/${productsDatasourceId}`),
      storyblokManagementClient.delete(`spaces/${config.storyblok.spaceId}/datasources/${promoCampaignsDatasourceId}`)
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

    let newPromoCampaignsDatasourceResponse = await storyblokManagementClient.post(`spaces/${config.storyblok.spaceId}/datasources`, {
      datasource: {
        name: 'Promo Campaigns',
        slug: config.storyblok.sync.promoCampaignsDatasourceSlug
      }
    })

    let requests = [];

    for (const category of categories) {
      requests.push(
        storyblokManagementClient.post(`spaces/${config.storyblok.spaceId}/datasource_entries`, {
          datasource_entry: {
            name: category._source.name,
            value: category._source.id,
            datasource_id: newCategoriesDatasourceResponse.data.datasource.id
          }
        })
      )
    }

    for (const product of products) {
      requests.push(storyblokManagementClient.post(`spaces/${config.storyblok.spaceId}/datasource_entries`, {
        datasource_entry: {
          name: product._source.name,
          value: product._source.id,
          datasource_id: newProductsDatasourceResponse.data.datasource.id
        }
      })
      )
    }

    for (const promoCampaign of promoCampaigns) {
      requests.push(storyblokManagementClient.post(`spaces/${config.storyblok.spaceId}/datasource_entries`, {
        datasource_entry: {
          name: promoCampaign._source.name,
          value: promoCampaign._source.id,
          datasource_id: newPromoCampaignsDatasourceResponse.data.datasource.id
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
