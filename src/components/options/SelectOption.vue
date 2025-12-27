<template>
  <div class="select-option">
    <select
      :value="modelValue"
      @change="onChange"
      class="select-input"
    >
      <option v-for="opt in option.options" :key="opt" :value="opt">
        {{ formatOptionLabel(opt) }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import type { CommandOption } from '../../types/command-options'

interface Props {
  option: CommandOption
  modelValue: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}

const formatOptionLabel = (opt: string): string => {
  // Capitalize first letter
  return opt.charAt(0).toUpperCase() + opt.slice(1)
}
</script>

<style scoped>
.select-option {
  display: flex;
  align-items: center;
}

.select-input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s;
  min-width: 150px;
}

.select-input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.select-input:hover {
  border-color: #adb5bd;
}
</style>
