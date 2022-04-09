import { expect } from 'chai'
import { randomUUID } from 'crypto'
import axios from 'axios'
import storage from './storage.service'

describe('Storage service', function () {
  const filename = randomUUID() + '.txt'

  it('Upload txt file to storage.', async () => {
    await storage.save(filename, Buffer.from('hallo world!', 'utf8'), { contentType: 'text/plain' })
    const exists = await storage.exists(filename)
    expect(exists).to.be.true
  })

  it('Convert file name to valid url.', async () => {
    const url = storage.createUrl(filename)
    const res = await axios(url)
    expect(res.status < 400).to.be.true
  })

  it('Convert url to valid file name.', () => {
    const url = storage.createUrl(filename)
    expect(storage.normalizeUrl(url)).to.equal(filename)
  })

  it('Delte txt file from storage.', async () => {
    const removed = await storage.remove(filename)
    expect(removed).to.be.true
  })
})
