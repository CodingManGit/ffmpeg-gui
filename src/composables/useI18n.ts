// Composable for i18n with type safety
import { useI18n as useVueI18n } from 'vue-i18n'

export function useI18n() {
  const { t, locale, availableLocales } = useVueI18n()

  return {
    t,
    locale,
    availableLocales
  }
}
