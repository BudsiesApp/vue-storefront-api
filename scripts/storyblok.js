const program = require('commander')
const config = require('config')

const { getClient } = require('../src/lib/opensearch');
const { initStoryblokClients } = require('../src/api/extensions/vsf-storyblok-extension/storyblok');
const { syncTarget } = require('../src/api/extensions/vsf-storyblok-extension/syncTarget');

const db = getClient(config);
initStoryblokClients(config);

program
  .command('sync')
  .description('Sync Storyblok stories and datasources')
  .option('-t|--target <target>', 'Target of synchronization: "stories", "datasources" or "all"')
  .action(async (cmd) => {
    try {
      await syncTarget(db, config, cmd.target)
      process.exit(0)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  });

program.parse(process.argv);
