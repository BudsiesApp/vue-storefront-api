const program = require('commander')
const config = require('config')

const { getClient } = require('../src/lib/elastic');
const { seedDatabase, seedStoryblokDatasources } = require('../src/api/extensions/vsf-storyblok-extension/sync');
const { initStoryblokClients } = require('../src/api/extensions/vsf-storyblok-extension/storyblok');
const { cacheInvalidate } = require('../src/api/extensions/vsf-storyblok-extension/helpers');

const db = getClient(config);
initStoryblokClients(config);

const availableOptions = ['all', 'stories', 'datasources'];

program
  .command('sync')
  .description('Sync Storyblok stories and datasources')
  .option('-t|--target <target>', 'Target of synchronization: "stories", "datasources" or "all"')
  .action(async (cmd) => {
    if (!cmd.target || !availableOptions.includes(cmd.target)) {
      console.error(`"target" option should be specified. Available options: ${availableOptions.join(', ')}`);
      process.exit(1)
    }

    if (cmd.target === 'all') {
      await Promise.all([
        seedDatabase(db, config),
        seedStoryblokDatasources(db, config)
      ])
    }

    if (cmd.target === 'stories') {
      await seedDatabase(db, config);
    }

    if (cmd.target === 'datasources') {
      await seedStoryblokDatasources(db, config);
    }

    await cacheInvalidate(config.storyblok, 'storyblok');

    process.exit(0)
  });

program.parse(process.argv);
