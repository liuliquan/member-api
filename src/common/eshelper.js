/**
 * This file defines helper methods
 */
const _ = require('lodash')
const config = require('config')

/**
 * Fetch members profile form ES
 * @param {Object} query the HTTP request query
 * @returns {Object} members and total
 */
async function getMembers (query, esClient, currentUser) {
  const handles = _.isArray(query.handles) ? query.handles : []
  const handlesLower = _.isArray(query.handlesLower) ? query.handlesLower : []
  var userIds = _.isArray(query.userIds) ? query.userIds : []
  // construct ES query for members profile
  let esQueryMembers = {
    index: config.get('ES.MEMBER_PROFILE_ES_INDEX'),
    size: query.perPage,
    from: (query.page - 1) * query.perPage,
    body: {
      sort: [{ handle: { order: query.sort } }]
    }
  }
  const boolQueryMembers = []
  if (query.userId) {
    boolQueryMembers.push({ match_phrase: { userId: query.userId } })
  }
  if (query.handleLower) {
    boolQueryMembers.push({ match_phrase: { handleLower: query.handleLower } })
  }
  if (query.handle) {
    boolQueryMembers.push({ match_phrase: { handle: query.handle } })
  }
  if (userIds.length > 0) {
    boolQueryMembers.push({ query: { terms: { userId: userIds } } })
  }
  if (handlesLower.length > 0) {
    boolQueryMembers.push({ query: { terms: { handleLower: handlesLower } } })
  }
  if (handles.length > 0) {
    boolQueryMembers.push({ query: { terms: { handle: handles } } })
  }
  boolQueryMembers.push({ match_phrase: { status: 'ACTIVE' } })
  if (boolQueryMembers.length > 0) {
    esQueryMembers.body.query = {
      bool: {
        filter: boolQueryMembers
      }
    }
  }
  // search with constructed query
  let { body: docsMembers } = await esClient.search(esQueryMembers)
  return docsMembers
}

/**
 * Fetch members skills form ES
 * @param {Object} query the HTTP request query
 * @returns {Object} members skills
 */
async function getMembersSkills (query, esClient) {
  // construct ES query for skills
  const esQuerySkills = {
    index: config.get('ES.MEMBER_SKILLS_ES_INDEX'),
    type: config.get('ES.MEMBER_SKILLS_ES_TYPE'),
    body: {
      sort: [{ userHandle: { order: query.sort } }]
    }
  }
  const boolQuerySkills = []

  if (query.handlesLower) {
    boolQuerySkills.push({ query: { terms: { handleLower: query.handlesLower } } })
  }
  esQuerySkills.body.query = {
    bool: {
      filter: boolQuerySkills
    }
  }
  // search with constructed query
  const { body: docsSkills } = await esClient.search(esQuerySkills)
  return docsSkills
}

/**
 * Fetch members stats form ES
 * @param {Object} query the HTTP request query
 * @returns {Object} members stats
 */
async function getMembersStats (query, esClient) {
  // construct ES query for stats
  const esQueryStats = {
    index: config.get('ES.MEMBER_STATS_ES_INDEX'),
    type: config.get('ES.MEMBER_STATS_ES_TYPE'),
    body: {
      sort: [{ handleLower: { order: query.sort } }]
    }
  }
  const boolQueryStats = []
  if (query.handlesLower) {
    boolQueryStats.push({ query: { terms: { handleLower: query.handlesLower } } })
    boolQueryStats.push({ match_phrase: { groupId: 10 } })
  }
  esQueryStats.body.query = {
    bool: {
      filter: boolQueryStats
    }
  }
  // search with constructed query
  const { body: docsStats } = await esClient.search(esQueryStats)
  return docsStats
}

/**
 * Fetch member profile suggestion from ES
 * @param {Object} query the HTTP request query
 * @returns {Object} suggestion
 */
async function getSuggestion (query, esClient, currentUser) {
  // construct ES query for members profile suggestion
  let esSuggestionMembers = {
    index: config.get('ES.MEMBER_PROFILE_ES_INDEX'),
    size: query.perPage,
    from: (query.page - 1) * query.perPage,
    body: {}
  }
  if (query.term) {
    esSuggestionMembers.body.suggest = {
      'handle-suggestion': {
        text: query.term,
        completion: {
          size: query.size,
          field: 'handleSuggest'
        }
      }
    }
  }
  // search with constructed query
  let { body: docsSuggestionMembers } = await esClient.search(esSuggestionMembers)
  return docsSuggestionMembers
}

/**
 * Get total items
 * @param {Object} docs the HTTP request query
 * @returns {Object} total
 */
function getTotal (docs) {
  let total = docs.hits.total.value || docs.hits.total
  if (_.isObject(total)) {
    total = total.value || 0
  }
  return total
}

module.exports = {
  getMembers,
  getMembersSkills,
  getMembersStats,
  getSuggestion,
  getTotal
}
