import StoryblokClient from 'storyblok-js-client'

export let storyblokClient
export let storyblokManagementClient

export function initStoryblokClients (config) {
  storyblokClient = new StoryblokClient({
    accessToken: config.storyblok.previewToken,
    cache: {
      type: 'none'
    }
  })

  storyblokManagementClient = new StoryblokClient({
    oauthToken: config.storyblok.managementToken,
    cache: {
      type: 'none'
    }
  })
}
