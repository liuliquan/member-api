/**
 * Controller for search endpoints
 */
const helper = require('../common/helper')
const service = require('../services/SearchService')

/**
 * Search members
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function searchMembers (req, res) {
  const result = await service.searchMembers(req.authUser, req.query)
  helper.setResHeaders(req, res, result)
  res.send(result.result)
}

module.exports = {
  searchMembers
}
