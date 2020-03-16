/**
 * Initialize elastic search.
 * It will create configured index in elastic search if it is not present.
 * It can delete and re-create index if providing an extra 'force' argument.
 * Usage:
 * node src/init-es
 * node src/init-es force
 */
const config = require('config')
const logger = require('./common/logger')
const helper = require('./common/helper')

const client = helper.getESClient()

const initES = async () => {
  if (process.argv.length === 3 && process.argv[2] === 'force') {
    logger.info(`Delete index ${config.ES.ES_INDEX} if any.`)
    try {
      await client.indices.delete({ index: config.ES.ES_INDEX })
    } catch (err) {
      // ignore
    }
    logger.info(`Delete index ${config.ES.MEMBER_TRAIT_ES_INDEX} if any.`)
    try {
      await client.indices.delete({ index: config.ES.MEMBER_TRAIT_ES_INDEX })
    } catch (err) {
      // ignore
    }
  }

  let exists = await client.indices.exists({ index: config.ES.ES_INDEX })
  if (exists) {
    logger.info(`The index ${config.ES.ES_INDEX} exists.`)
  } else {
    logger.info(`The index ${config.ES.ES_INDEX} will be created.`)

    const body = { mappings: {} }
    body.mappings[config.get('ES.ES_TYPE')] = {
      properties: {
        handleLower: { type: 'keyword' },
        handle: { type: 'keyword' },
        userId: { type: 'keyword' },
        status: { type: 'keyword' }
      }
    }

    await client.indices.create({
      index: config.ES.ES_INDEX,
      body
    })
  }
  exists = await client.indices.exists({ index: config.ES.MEMBER_TRAIT_ES_INDEX })
  if (exists) {
    logger.info(`The index ${config.ES.MEMBER_TRAIT_ES_INDEX} exists.`)
  } else {
    logger.info(`The index ${config.ES.MEMBER_TRAIT_ES_INDEX} will be created.`)

    const body = { mappings: {} }
    body.mappings[config.get('ES.MEMBER_TRAIT_ES_TYPE')] = {
      properties: {
        userId: { type: 'keyword' },
        traitId: { type: 'keyword' }
      }
    }

    await client.indices.create({
      index: config.ES.MEMBER_TRAIT_ES_INDEX,
      body
    })
  }
}

initES().then(() => {
  logger.info('Done!')
  process.exit()
}).catch((e) => {
  logger.logFullError(e)
  process.exit()
})
