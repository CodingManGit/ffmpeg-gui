<template>
  <div class="language-switcher">
    <select
      v-model="currentLocale"
      @change="changeLocale"
      class="locale-select"
      :title="$t('language.title')"
    >
      <option value="en">{{ $t('language.english') }}</option>
      <option value="zh">{{ $t('language.chinese') }}</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const currentLocale = ref(locale.value)

// Watch for changes in locale to update the select
watch(locale, (newLocale) => {
  currentLocale.value = newLocale
})

const changeLocale = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newLocale = target.value

  // Update Vue I18n locale
  locale.value = newLocale

  // Save to localStorage for persistence
  localStorage.setItem('locale', newLocale)

  // Update document language attribute
  document.documentElement.lang = newLocale
}
</script>

<style scoped>
.language-switcher {
  display: inline-block;
}

.locale-select {
  padding: 6px 12px;
  font-size: 14px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.locale-select:hover {
  border-color: #adb5bd;
}

.locale-select:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.1);
}
</style>
