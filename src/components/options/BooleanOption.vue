<template>
  <div class="boolean-option">
    <label class="toggle-switch">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="onChange"
        class="toggle-input"
      />
      <span class="toggle-slider"></span>
    </label>
  </div>
</template>

<script setup lang="ts">
import type { CommandOption } from '../../types/command-options'

interface Props {
  option: CommandOption
  modelValue: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const onChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<style scoped>
.boolean-option {
  display: flex;
  align-items: center;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-input:checked + .toggle-slider {
  background-color: #007bff;
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.toggle-input:focus + .toggle-slider {
  box-shadow: 0 0 1px #007bff;
}
</style>
