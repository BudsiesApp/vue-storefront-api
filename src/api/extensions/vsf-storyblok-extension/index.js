import { Router } from 'express'
import { apiStatus } from '../../../lib/util'
import { getClient } from '../../../lib/elastic'
import { fullSync, handleHook, seedDatabase, seedStoryblokDatasources } from './sync'
import { getStory, log, cacheInvalidate, validateEditor } from './helpers'
import { initStoryblokClients } from './storyblok'
import protectRoute from './middleware/protectRoute'

module.exports = ({ config }) => {
  if (!config.storyblok || !config.storyblok.previewToken) {
    throw new Error('🧱 : config.storyblok.previewToken not found')
  }
  const db = getClient(config)
  const api = Router()

  initStoryblokClients(config)
  seedDatabase(db, config)
  seedStoryblokDatasources(db, config)

  api.get('/story/', async (req, res) => {
    const story = await getStory(db, config.storyblok.storiesIndex, 'home')
    apiStatus(res, story)
  })

  api.get('/story/:story*', async (req, res) => {
    let path = req.params.story + req.params[0]
    if (config.storeViews[path]) {
      path += '/home'
    }
    const story = await getStory(db, config.storyblok.storiesIndex, path)
    apiStatus(res, story)
  })

  api.get('/validate-editor', async (req, res) => {
    try {
      const result = validateEditor(config, req.query)
      apiStatus(res, result)
    } catch (error) {
      apiStatus(res, {
        error: 'Unauthorized editor'
      }, 403)
    }
  })

  api.post('/hook', protectRoute(config), async (req, res) => {
    try {
      await handleHook(db, config, req.body)
      apiStatus(res)
    } catch (error) {
      log('Hook failed!')
      log(error.stack)
      apiStatus(res, {
        error: 'Webhook failed!'
      }, 403)
    }
  })

  api.get('/full', protectRoute(config), async (req, res) => {
    await fullSync(db, config)
    await cacheInvalidate(config.storyblok)
    log('Stories synced!')
    apiStatus(res)
  })

  return api
}
