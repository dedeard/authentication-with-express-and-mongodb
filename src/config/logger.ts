import path from 'path'
import { createLogger, format, transports } from 'winston'
import config from './config'

const logger = createLogger({
  level: config.isDev || config.isTest ? 'debug' : 'info',
  format: config.isDev ? format.combine(format.colorize(), format.simple()) : format.combine(format.timestamp(), format.json()),
})

if (config.isDev) {
  logger.add(new transports.Console())
} else {
  logger.add(
    new transports.File({
      filename: path.join(__dirname, '../../logs/error' + (config.isTest ? '.test' : '') + '.log'),
      level: 'error',
    }),
  )
  logger.add(
    new transports.File({
      filename: path.join(__dirname, '../../logs/combined' + (config.isTest ? '.test' : '') + '.log'),
    }),
  )
}

export default logger
