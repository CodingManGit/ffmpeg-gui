<template>
  <div class="option-help">
    <div
      class="help-icon"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      ?
    </div>
    <div v-if="showTooltip" class="help-tooltip">
      <div class="tooltip-header">
        <strong>{{ option.name }}</strong>
      </div>
      <div class="tooltip-description">{{ option.description }}</div>
      <div class="tooltip-specification">{{ option.specification }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { CommandOption } from '../../types/command-options'

interface Props {
  option: CommandOption
}

defineProps<Props>()

const showTooltip = ref(false)
</script>

<style scoped>
.option-help {
  position: relative;
  display: inline-block;
  margin-left: 8px;
}

.help-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #6c757d;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  cursor: help;
  user-select: none;
}

.help-icon:hover {
  background-color: #5a6268;
}

.help-tooltip {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  min-width: 250px;
  max-width: 400px;
  background-color: #343a40;
  color: white;
  border-radius: 4px;
  padding: 12px;
  font-size: 13px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  line-height: 1.4;
}

.help-tooltip::before {
  content: "";
  position: absolute;
  bottom: 100%;
  left: 10px;
  border-width: 6px;
  border-style: solid;
  border-color: transparent transparent #343a40 transparent;
}

.tooltip-header {
  margin-bottom: 8px;
  font-size: 14px;
  color: #f8f9fa;
}

.tooltip-description {
  margin-bottom: 8px;
  color: #dee2e6;
}

.tooltip-specification {
  padding-top: 8px;
  border-top: 1px solid #495057;
  color: #adb5bd;
  font-size: 12px;
}
</style>
