import path from 'path'
import i18n from 'i18n'

i18n.configure({
  locales: ['en', 'id'],
  defaultLocale: 'en',
  directory: path.join(__dirname, '../../lang'),
})

export const __ = i18n.__

export default i18n
