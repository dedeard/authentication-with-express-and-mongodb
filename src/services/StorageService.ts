import { SaveOptions, Storage } from '@google-cloud/storage'
import config from '../config/config'

const storage = new Storage({
  credentials: config.googleCLoudKey,
  projectId: config.googleCLoudKey.project_id,
})
const bucket = storage.bucket(String(config.bucketName))

class StorageService {
  static async save(name: string, data: string | Buffer, makePublic?: true, option?: SaveOptions): Promise<void> {
    await bucket.file(name).save(data, option || { contentType: 'image/jpeg' })
    if (makePublic) {
      await bucket.file(name).makePublic()
    }
  }

  static async delete(name: string): Promise<boolean> {
    return !!(await bucket.file(name).delete())
  }

  static async exists(name: string): Promise<boolean> {
    return !!(await bucket.file(name).exists())
  }

  static createUrl(name: string): string {
    return `https://storage.googleapis.com/${bucket.name}/${name}`
  }

  static normalizeUrl(url: string): string {
    return url.replace(`https://storage.googleapis.com/${bucket.name}/`, '')
  }
}

export default StorageService
