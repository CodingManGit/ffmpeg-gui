# Internationalization (i18n) Setup

This project uses [vue-i18n](https://vue-i18n.intlify.dev/) for internationalization support.

## Structure

```
src/
├── locales/
│   ├── index.ts       # i18n configuration
│   ├── en.ts          # English translations
│   └── zh.ts          # Chinese translations
├── components/
│   └── LanguageSwitcher.vue  # Language switcher component
└── composables/
    └── useI18n.ts     # I18n composable (optional)
```

## Usage

### In Vue Components (Composition API)

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
</script>

<template>
  <h1>{{ t('common.title') }}</h1>
  <p>{{ t('fileExplorer.selected', { count: 5 }) }}</p>
</template>
```

### In Vue Components (Options API)

```vue
<script>
export default {
  methods: {
    getMessage() {
      return this.$t('common.title')
    }
  }
}
</script>

<template>
  <h1>{{ $t('common.title') }}</h1>
</template>
```

### With TypeScript Support

For better type inference, you can add global type definitions. Create a `src/types/vue-i18n.d.ts` file:

```typescript
export {}
declare global {
  export interface I18nMessages {
    common: {
      select: string
      cancel: string
      // ... more keys
    }
    language: {
      title: string
      english: string
      chinese: string
    }
    // ... more namespaces
  }
}
```

## Adding New Translations

1. Add the translation key to both `src/locales/en.ts` and `src/locales/zh.ts`:

```typescript
// src/locales/en.ts
export default {
  newSection: {
    newKey: 'New translation'
  }
}

// src/locales/zh.ts
export default {
  newSection: {
    newKey: '新翻译'
  }
}
```

2. Use the translation in your component:

```vue
<template>
  <p>{{ t('newSection.newKey') }}</p>
</template>
```

## Adding New Languages

1. Create a new locale file (e.g., `src/locales/ja.ts` for Japanese):

```typescript
export default {
  common: {
    select: '選択',
    cancel: 'キャンセル',
    // ... more translations
  }
  // ... more sections
}
```

2. Import and add to messages in `src/locales/index.ts`:

```typescript
import ja from './ja'

const messages = {
  en,
  zh,
  ja  // Add new language
}
```

3. Add the language option to the LanguageSwitcher component:

```vue
<option value="ja">日本語</option>
```

## Features

- **Automatic locale detection**: Detects browser language on first load
- **Persistent selection**: Saves language preference to localStorage
- **Type-safe**: Full TypeScript support
- **Composition API**: Built for Vue 3 Composition API
- **Legacy support**: Also works with Options API

## Language Switcher

The `LanguageSwitcher` component is included in the main app header and provides:
- Dropdown selector for available languages
- Automatic persistence of user's language choice
- Updates document language attribute for accessibility

## Best Practices

1. **Organize translations by feature**: Group related translations under meaningful namespaces
2. **Use parameterized strings**: For dynamic content, use parameters:
   ```typescript
   // Locale file
   selected: '{count} selected'
   selected: '已选择 {count} 个'

   // Component
   {{ t('fileExplorer.selected', { count: items.length }) }}
   ```
3. **Keep translations synchronized**: Always add translations to all locale files
4. **Use descriptive keys**: Use dot notation for nested structures (e.g., `common.save`)
5. **Test all languages**: Verify UI layout works with different text lengths

## Pluralization

For handling plurals, use the plural syntax:

```typescript
// Locale file
items: 'no items | one item | {count} items'
items: '没有项目 | 一个项目 | {count} 个项目'

// Component
{{ $tn('fileExplorer.items', items.length) }}
```

## Date/Number Formatting

vue-i18n also provides formatting utilities:

```typescript
const { d, n } = useI18n()

// Format date
d(new Date(), 'short')

// Format number
n(1234.56, { style: 'currency', currency: 'USD' })
```
