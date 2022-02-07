import crypto from 'crypto'
import request from 'request'
import { promisify } from 'util'

const rp = promisify(request)

export function getHits (result) {
  if (result.body) { // differences between ES5 andd ES7
    return result.body.hits
  } else {
    return result.hits
  }
}

export function getHitsAsStory (hits) {
  if (hits.total === 0) {
    throw new Error('Missing story')
  }
  const story = hits.hits[0]._source
  if (typeof story.content === 'string') {
    story.content = JSON.parse(story.content)
  }
  return story
}

function getHitsAsStories (hits) {
  if (hits.total === 0) {
    log('Missing stories')
    return []
  }
  const stories = hits.hits.map((hit) => hit._source)

  for (const story of stories) {
    if (typeof story.content === 'string') {
      story.content = JSON.parse(story.content)
    }
  }

  return stories
}

export const transformStory = (story, forIndexing = true) => {
  story.content = JSON.stringify(story.content)
  story.full_slug = story.full_slug.replace(/^\/|\/$/g, '')
  const result = {
    index: 'storyblok_stories',
    type: 'story', // XXX: Change to _doc once VSF supports Elasticsearch 6
    id: story.id + '_' + story.full_slug
  }

  if (forIndexing) {
    result.body = story
  }

  return result
}

function mapStoryToBulkAction ({ story: { id, full_slug } }) {
  return {
    index: {
      _id: id + '_' + full_slug,
      _index: 'storyblok_stories',
      _type: 'story'
    }
  }
}

export function createBulkOperations (stories = []) {
  return stories.reduce((accumulator, story) => {
    accumulator.push(mapStoryToBulkAction({ story }))
    accumulator.push({
      ...story,
      content: JSON.stringify(story.content)
    })
    return accumulator
  }, [])
}

export function createIndex (config) {
  return {
    index: 'storyblok_stories',
    body: {
      index: {
        mapping: {
          total_fields: {
            limit: config.storyblok.fieldLimit || 1000
          }
        }
      }
    }
  }
}

export function queryByPath (path) {
  return {
    index: 'storyblok_stories',
    type: 'story',
    body: {
      query: {
        constant_score: {
          filter: {
            term: {
              'full_slug.keyword': path
            }
          }
        }
      }
    }
  }
}

export const log = (string) => {
  console.log('📖 : ' + string) // eslint-disable-line no-console
}

export const cacheInvalidate = async (config) => {
  if (config.invalidate) {
    log(`Invalidating cache... (${config.invalidate})`)
    await rp({
      uri: config.invalidate
    })
    log('Invalidated cache ✅')
  }
}

export const getStory = async (db, path) => {
  try {
    const response = await db.search(queryByPath(path))
    const hits = getHits(response)
    const story = getHitsAsStory(hits)
    return story
  } catch (error) {
    return {
      story: false
    }
  }
}

export const getStoriesMatchedToId = async (db, id) => {
  const response = await db.search({
    index: 'storyblok_stories',
    type: 'story',
    body: {
      query: {
        bool: {
          must: {
            match: {
              'id': id
            }
          }
        }
      }
    }
  })
  const hits = getHits(response)
  return getHitsAsStories(hits)
}

export const getStoriesWithIdReference = async (db, id) => {
  const response = await db.search({
    index: 'storyblok_stories',
    type: 'story',
    size: 1000,
    body: {
      query: {
        constant_score: {
          filter: {
            match_phrase: {
              'content': `"id": ${id}`
            }
          }
        }
      }
    }
  })
  const hits = getHits(response)
  return getHitsAsStories(hits)
}

export const validateEditor = (config, params) => {
  const { spaceId, timestamp, token } = params

  const validationString = `${spaceId}:${config.storyblok.previewToken}:${timestamp}`
  const validationToken = crypto.createHash('sha1').update(validationString).digest('hex')
  if (token === validationToken && timestamp > Math.floor(Date.now() / 1000) - 3600) {
    return {
      previewToken: config.storyblok.previewToken,
      error: false
    }
  }
  throw new Error('Unauthorized editor')
}
