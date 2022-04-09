const data = require('../../package.json')

/**
 * User model
 * @typedef {object} User
 * @property {string} id
 * @property {string} name.required
 * @property {string} email.required
 * @property {boolean} admin
 * @property {string} avatar
 * @property {string} lastLogin
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Token model
 * @typedef {object} Token
 * @property {string} bearer
 * @property {string} expiredAt
 */

/**
 * Auth token scheme
 * @typedef {object} AuthToken
 * @property {Token} access - access token
 * @property {Token} refresh - refresh token
 */

/**
 * User login scheme
 * @typedef {object} UserLogin
 * @property {User} user
 * @property {AuthToken} token
 */

/**
 * Update avatar scheme
 * @typedef {object} UpdateAvatar
 * @property {string} image.required - image - binary
 */

/**
 * Unauthorized error example
 * @typedef {object} UnauthorizedError
 * @property {number} statusCode - 401
 * @property {string} message - error message
 */

const swaggerOptions = {
  info: {
    version: data.version,
    title: 'Cirsqu auth',
    description: data.description,
    license: {
      name: data.license,
    },
  },
  security: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  baseDir: __dirname,
  filesPattern: '../**/*.ts',
  swaggerUIPath: '/api-docs',
  exposeSwaggerUI: true,
  exposeApiDocs: true,
  apiDocsPath: '/',
  notRequiredAsNullable: false,
  swaggerUiOptions: {},
  multiple: true,
}

export default swaggerOptions
