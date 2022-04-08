import 'dotenv/config'

const config = {
  port: Number(process.env.PORT),
  host: process.env.HOST,
  isDev: process.env.NODE_ENV === 'development',
  mongodbUrl: process.env.MONGODB_URL,
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
  resetPasswordExpMinutes: Number(process.env.RESET_PASSWORD_EXP_MINUTES),
  amqp: {
    url: process.env.AMQP_URL,
    resetPasswordQueue: process.env.AMQP_RESET_PASSWORD_QUEUE,
  },
}

export default config
