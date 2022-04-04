import connectDB from './config/connectDB'
import Application from './app'

const application = new Application()

// connect to db and run application
connectDB().then(() => application.listen())
