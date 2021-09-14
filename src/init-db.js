/**
 * Initialize database tables. All data will be cleared.
 */
require('../app-bootstrap')
const logger = require('./common/logger')
const helper = require('./common/helper')

logger.info('Initialize database.')

const initDB = async () => {
  const members = await helper.scan('Member')
  for (const item of members) {
    await item.delete()
  }
  const memberAggregatedSkills = await helper.scan('MemberAggregatedSkills')
  for (const item of memberAggregatedSkills) {
    await item.delete()
  }
  const memberDistributionStats = await helper.scan('MemberDistributionStats')
  for (const item of memberDistributionStats) {
    await item.delete()
  }
  const memberEnteredSkills = await helper.scan('MemberEnteredSkills')
  for (const item of memberEnteredSkills) {
    await item.delete()
  }
  const memberFinancials = await helper.scan('MemberFinancial')
  for (const item of memberFinancials) {
    await item.delete()
  }
  const memberHistoryStats = await helper.scan('MemberHistoryStats')
  for (const item of memberHistoryStats) {
    await item.delete()
  }
  const memberHistoryStatsPrivate = await helper.scan('MemberHistoryStatsPrivate')
  for (const item of memberHistoryStatsPrivate) {
    await item.delete()
  }
  const memberStats = await helper.scan('MemberStats')
  for (const item of memberStats) {
    await item.delete()
  }
  const traits = await helper.scan('MemberTrait')
  for (const trait of traits) {
    await trait.delete()
  }
}

initDB().then(() => {
  logger.info('Done!')
  process.exit()
}).catch((e) => {
  logger.logFullError(e)
  process.exit(1)
})
