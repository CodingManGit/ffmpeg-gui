<template>
  <div class="text-option">
    <input
      :type="inputType"
      :value="modelValue"
      :placeholder="option.placeholder"
      @input="onInput"
      class="text-input"
      :class="{ 'is-invalid': !isValid }"
    />
    <div v-if="!isValid" class="validation-error">
      Invalid format
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CommandOption } from '../../types/command-options'

interface Props {
  option: CommandOption
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputType = ref<'text' | 'number'>('text')
const isValid = ref(true)

// Determine if it should be a number input
if (props.option.type === 'number') {
  inputType.value = 'number'
}

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  // Validate if validation pattern is provided
  if (props.option.validation) {
    const regex = new RegExp(props.option.validation)
    isValid.value = regex.test(value) || value === ''
  }

  emit('update:modelValue', value)
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (props.option.validation) {
    const regex = new RegExp(props.option.validation)
    isValid.value = regex.test(newValue) || newValue === ''
  }
})
</script>

<style scoped>
.text-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.text-input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.text-input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.text-input.is-invalid {
  border-color: #dc3545;
}

.text-input.is-invalid:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
}

.validation-error {
  color: #dc3545;
  font-size: 12px;
}
</style>
