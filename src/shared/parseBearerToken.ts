import { IncomingMessage } from 'http'

/**
 * Parse the `token` from the given `req`'s authorization header.
 *
 * @param req
 * @returns
 */
function parseBearerToken(req: IncomingMessage): string | null {
  const auth = req.headers ? req.headers.authorization || null : null
  if (!auth) return null

  const parts = auth.split(' ')
  if (parts.length < 2) return null

  const schema = (parts.shift() as string).toLowerCase()
  const token = parts.join(' ')
  if (schema !== 'bearer') return null

  return token
}

export default parseBearerToken
