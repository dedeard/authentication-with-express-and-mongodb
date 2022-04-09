import { expect } from 'chai'
import config from '../config/config'
import NotificationService from './notification.service'

describe('Notification Service', function () {
  const notif = new NotificationService()

  it('Send reset password notification queue.', async () => {
    await notif.sendResetPasswordUrl('this-is-fake-token', 'dede@example.com')

    await notif.open()
    await notif.ch?.assertQueue(String(config.amqp.resetPasswordQueue), {
      durable: true,
    })
    await notif.ch?.prefetch(1)
    const isValid = await new Promise<boolean>((resolve) => {
      const setValid = (valid: boolean) => {
        resolve(valid)
      }
      const timeOut = setTimeout(() => {
        setValid(false)
      }, 250)
      notif.ch?.consume(String(config.amqp.resetPasswordQueue), (msg) => {
        const parsedMsg = JSON.parse(msg.content.toString())
        if ((parsedMsg.token === 'this-is-fake-token', parsedMsg.email === 'dede@example.com')) {
          clearTimeout(timeOut)
          setValid(true)
        }
        notif.ch?.ack(msg)
      })
    })
    await notif.close()
    expect(isValid).to.be.true
  })
})
