import { createI18n } from 'vue-i18n'
import en from './en'
import zh from './zh'

const messages = {
  en,
  zh
}

// Get locale from localStorage or use browser language
const getLocale = (): string => {
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && (savedLocale === 'en' || savedLocale === 'zh')) {
    return savedLocale
  }

  // Check browser language
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    return 'zh'
  }

  return 'en'
}

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getLocale(),
  fallbackLocale: 'en',
  messages
})

export default i18n
