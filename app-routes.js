/**
 * Configure all routes for express app
 */

const _ = require('lodash')
const config = require('config')
const HttpStatus = require('http-status-codes')
const helper = require('./src/common/helper')
const errors = require('./src/common/errors')
const routes = require('./src/routes')
const authenticator = require('tc-core-library-js').middleware.jwtAuthenticator

/**
 * Configure all routes for express app
 * @param app the express app
 */
module.exports = (app) => {
  // Load all routes
  _.each(routes, (verbs, path) => {
    _.each(verbs, (def, verb) => {
      const controllerPath = `./src/controllers/${def.controller}`
      const method = require(controllerPath)[def.method]; // eslint-disable-line
      if (!method) {
        throw new Error(`${def.method} is undefined`)
      }

      const actions = []
      actions.push((req, res, next) => {
        req.signature = `${def.controller}#${def.method}`
        next()
      })

      actions.push((req, res, next) => {
        if (_.get(req, 'query.authToken')) {
          _.set(req, 'headers.authorization', `Bearer ${_.trim(req.query.authToken)}`)
        }
        next()
      })

      if (def.auth) {
        // add Authenticator/Authorization check if route has auth
        actions.push((req, res, next) => {
          // When authorization token is not provided and allow no token is enabled then bypass
          if (!_.get(req, 'headers.authorization') && def.allowNoToken) {
            next()
          } else {
            authenticator(_.pick(config, ['AUTH_SECRET', 'VALID_ISSUERS']))(req, res, next)
          }
        })

        actions.push((req, res, next) => {
          // When authorization token is not provided and allow no token is enabled then bypass
          if (!_.get(req, 'headers.authorization') && def.allowNoToken) {
            next()
          } else {
            if (req.authUser.isMachine) {
              // M2M
              if (!req.authUser.scopes || (def.scopes && !helper.checkIfExists(def.scopes, req.authUser.scopes))) {
                next(new errors.ForbiddenError('You are not allowed to perform this action!'))
              } else {
                next()
              }
            } else {
              req.authUser.userId = String(req.authUser.userId)
              // User roles authorization
              if (req.authUser.roles) {
                if (def.access && !helper.checkIfExists(def.access, req.authUser.roles)) {
                  next(new errors.ForbiddenError('You are not allowed to perform this action!'))
                } else {
                  next()
                }
              } else {
                next(new errors.ForbiddenError('You are not authorized to perform this action'))
              }
            }
          }
        })
      } else {
        // public API, but still try to authenticate token if provided, but allow missing/invalid token
        actions.push((req, res, next) => {
          const interceptRes = {}
          interceptRes.status = () => interceptRes
          interceptRes.json = () => interceptRes
          interceptRes.send = () => next()
          authenticator(_.pick(config, ['AUTH_SECRET', 'VALID_ISSUERS']))(req, interceptRes, next)
        })

        actions.push((req, res, next) => {
          if (!req.authUser) {
            next()
          } else if (req.authUser.isMachine) {
            // M2M
            if (!req.authUser.scopes || (def.scopes && !helper.checkIfExists(def.scopes, req.authUser.scopes))) {
              next(new errors.ForbiddenError('You are not allowed to perform this action!'))
            } else {
              next()
            }
          } else {
            req.authUser.userId = String(req.authUser.userId)
            // User roles authorization
            if (req.authUser.roles) {
              if (def.access && !helper.checkIfExists(def.access, req.authUser.roles)) {
                next(new errors.ForbiddenError('You are not allowed to perform this action!'))
              } else {
                next()
              }
            } else {
              next(new errors.ForbiddenError('You are not authorized to perform this action'))
            }
          }
        })
      }

      actions.push(method)
      app[verb](`/${config.API_VERSION}${path}`, helper.autoWrapExpress(actions))
    })
  })

  // Check if the route is not found or HTTP method is not supported
  app.use('*', (req, res) => {
    if (routes[req.baseUrl]) {
      res.status(HttpStatus.METHOD_NOT_ALLOWED).json({
        message: 'The requested HTTP method is not supported.'
      })
    } else {
      res.status(HttpStatus.NOT_FOUND).json({
        message: 'The requested resource cannot be found.'
      })
    }
  })
}
