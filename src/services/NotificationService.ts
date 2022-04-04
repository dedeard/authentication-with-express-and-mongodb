import { Connection, Channel } from 'amqplib-as-promised'
import config from '../config/config'

class NotificationService {
  private conn?: Connection
  private ch?: Channel

  /**
   * Open rabbitmq connection.
   *
   */
  async open(): Promise<void> {
    this.conn = new Connection(String(config.amqp.url))
    await this.conn.init()
    this.ch = await this.conn.createChannel()
  }

  /**
   * Close rabbitmq connection.
   *
   */
  async close(): Promise<void> {
    await this.ch?.close()
    await this.conn?.close()
  }

  /**
   * Send reset password email.
   *
   * @param url
   * @param email
   */
  async sendResetPasswordUrl(url: string, email: string): Promise<void> {
    await this.open()
    const msg = Buffer.from(JSON.stringify({ url, email }))
    await this.ch?.assertQueue(String(config.amqp.resetPasswordQueue), {
      durable: true,
    })
    await this.ch?.sendToQueue(String(config.amqp.resetPasswordQueue), msg, {
      persistent: true,
    })
  }
}

export default NotificationService
