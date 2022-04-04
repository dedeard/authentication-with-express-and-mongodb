import { connect, connection } from 'mongoose'
import config from './config'
import logger from './logger'

connection.on('connected', () => {
  logger.info('MongoDB connected')
})

connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
})

connection.on('reconnected', () => {
  logger.warn('MongoDB reconnected')
})

async function connectDB() {
  await connect(String(config.mongodbUrl)).catch((err) => {
    logger.error('MongoDB ' + err)
  })
}

export default connectDB
