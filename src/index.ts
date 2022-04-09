import { connect } from './config/connect'
import Application from './app'

const application = new Application()

// connect to db and run application
connect().then(() => application.listen())
