import { seedDatabase, seedStoryblokDatasources } from './sync'
import { cacheInvalidate } from './helpers'

const phases = {
  stories: seedDatabase,
  datasources: seedStoryblokDatasources
}

const targetPhases = {
  all: ['stories', 'datasources'],
  stories: ['stories'],
  datasources: ['datasources']
}

export const syncTargets = Object.keys(targetPhases)

function toSyncError (failures) {
  if (failures.length === 1) {
    return failures[0].reason
  }

  const error = new Error(`Storyblok sync failed: ${failures.map(({ phase }) => phase).join(', ')}`)
  error.errors = failures.map(({ reason }) => reason)
  return error
}

/**
 * Runs every phase of the target to completion before reporting failures,
 * so a failing phase never interrupts a stories rebuild that is still running.
 * The cache is invalidated when a phase succeeded and the stories index is not left broken.
 */
export async function syncTarget (db, config, target) {
  if (!syncTargets.includes(target)) {
    throw new Error(`"target" option should be specified. Available options: ${syncTargets.join(', ')}`)
  }

  const names = targetPhases[target]
  const results = await Promise.allSettled(names.map(name => phases[name](db, config)))
  const failures = results
    .map((result, i) => ({ phase: names[i], ...result }))
    .filter(({ status }) => status === 'rejected')

  const storiesFailed = failures.some(({ phase }) => phase === 'stories')

  if (failures.length < results.length && !storiesFailed) {
    try {
      await cacheInvalidate(config.storyblok, 'storyblok')
    } catch (reason) {
      failures.push({ phase: 'cache invalidation', status: 'rejected', reason })
    }
  }

  if (failures.length) {
    throw toSyncError(failures)
  }
}
