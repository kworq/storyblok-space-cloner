<script setup lang="ts">
import { useFieldPlugin } from '@storyblok/field-plugin/vue3'
import { SbToggle, SbTextField } from '@storyblok/design-system'
import { ref, watch } from 'vue';

const plugin = useFieldPlugin({
  validateContent: (content: unknown) => ({
    content: typeof content === 'boolean' ? content : undefined,
  }),
})
const maxFeatureLen = ref(35);
const checked = ref(false);
// Watch the checked state and call a callback function when it changes
watch(checked, (newVal, oldVal) => {
  console.log(`Checkbox state changed from ${oldVal} to ${newVal}`);
  plugin?.actions?.setContent(newVal);
  // Add your callback logic here
});
</script>

<template>
  <SbTextField
    id="example-max-length"
    name="example"
    :label="'With max length ' + maxFeatureLen"
    :disabled="false"
    :required="true"
    placeholder="Feature name"
    :readonly="false"
    modelValue="Boris Spassky"
    nativeValue="Boris Spassky"
    errorMessage=""
    :error="false"
    :clearable="true"
    :ghost="false"
    prefix=""
    suffix=""
    :maxlength="maxFeatureLen"
    mask="undefined"
    :auto-grow="false"
  />
    <SbToggle
      v-if="plugin.type === 'loaded'"
      data-testid="toggle"
      id="toggle"
      name="toggle"
      :label="featureName"
      showLabel="true"
      :indeterminate="false"
      :disabled="false"
      :required="false"
      variant="primary"
      :icon="undefined"
      :nativeValue="checked"
      :modelValue="checked"
      @update:modelValue="checked = $event"
    />
</template>
