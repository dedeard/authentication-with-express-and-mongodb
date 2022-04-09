import mongoose from 'mongoose'
import config from './config'
import logger from './logger'

mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected')
})

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
})

mongoose.connection.on('reconnected', () => {
  logger.warn('MongoDB reconnected')
})

export async function connect() {
  await mongoose.connect(String(config.mongodbUrl)).catch((err) => {
    logger.error('MongoDB ' + err)
  })
}

export async function disconnect() {
  await mongoose.disconnect().catch((err) => {
    logger.error('MongoDB ' + err)
  })
}
