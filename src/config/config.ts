import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '../../.env') })

const config = {
  port: Number(process.env.PORT),
  host: process.env.HOST,
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  mongodbUrl: process.env.MONGODB_URL,
  resetPasswordExpMinutes: Number(process.env.RESET_PASSWORD_EXP_MINUTES),
  whitelistOrigins: process.env.WHITELIST_ORIGINS,

  bucketName: process.env.GC_BUCKET_NAME,
  googleCLoudKey: {
    project_id: process.env.GC_PROJECT_ID,
    private_key: String(process.env.GC_PRIVATE_KEY).replace(/\\n/g, '\n'),
    client_email: process.env.GC_CLIENT_EMAIL,
  },

  jwt: {
    access: {
      secret: String(process.env.JWT_ACCESS_SECRET),
      expMinutes: Number(process.env.JWT_ACCESS_EXP_MINUTES),
    },
    refresh: {
      secret: String(process.env.JWT_REFRESH_SECRET),
      expDays: Number(process.env.JWT_REFRESH_EXP_DAYS),
    },
  },

  amqp: {
    url: process.env.AMQP_URL,
    resetPasswordQueue: process.env.AMQP_RESET_PASSWORD_QUEUE,
  },
}

export default config
