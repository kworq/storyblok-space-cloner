<script setup lang="ts">
import { useFieldPlugin } from '@storyblok/field-plugin/vue3'
import { SbToggle, SbTextField, SbButton, SbIcon, SbCheckbox, SbSeparator } from '@storyblok/design-system'
import { ref, watch, onMounted } from 'vue'

const plugin = useFieldPlugin({
  validateContent: (content: unknown) => ({
    content: content,
  }),
})

interface Feature {
  name: string;
  id: number;
}
interface Competitor {
  name: string;
  id: number;
  highlight: boolean;
  [key: string]: string | boolean | number;
}

const maxFeatureLen = ref(35)
const features = ref([{ name: '', id: Date.now() }] as Feature[])
const competitors = ref([{ name: '', id: Date.now(), highlight: false }] as Competitor[])
let initCount = 0;

const initializeData = () => {
  initCount++;
  if (plugin?.type !== 'loaded') {
    if (initCount > 10) {
      return
    }
    return window.setTimeout(initializeData, 100)
  }
  const content = plugin?.data?.content as { features: Feature[]; competitors: Competitor[] }
  if (content) {
    if (content.features) {
      features.value = content.features.map((feature: Feature) => ({
        ...feature,
        id: feature.id || Date.now(),
      }))
    }
    if (content.competitors) {
      competitors.value = content.competitors.map((competitor: Competitor) => ({
        ...competitor,
        id: competitor.id || Date.now(),
        highlight: competitor.highlight || false,
      }))
    }
  }
}

const injectCSS = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    :root {
      font-family: Roboto, sans-serif;
      font-size: 62.5%;
    }
    .flex {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
    }
    .flex-col {
      flex-direction: column;
    }
    .flex-row {
      flex-direction: row;
      align-items: center;
    }
    .remove-button {
      margin-left: 1rem;
    }
    .mt-auto {
      margin-top: auto;
    }
    .sb-textfield__container {
      flex-grow: 1;
    }
  `;
  document.head.appendChild(style);
}

onMounted(() => {
  initializeData()
  injectCSS()
})

const addFeature = () => {
  features.value.push({ name: '', id: Date.now() })
}

const removeFeature = (index: number) => {
  features.value.splice(index, 1)
}

const addCompetitor = () => {
  competitors.value.push({ name: '', id: Date.now(), highlight: false })
}

const removeCompetitor = (index: number) => {
  competitors.value.splice(index, 1)
}

const moveFeature = (index: number, direction: 'up' | 'down') => {
  if (direction === 'up' && index > 0) {
    const temp = features.value[index]
    features.value[index] = features.value[index - 1]
    features.value[index - 1] = temp
  } else if (direction === 'down' && index < features.value.length - 1) {
    const temp = features.value[index]
    features.value[index] = features.value[index + 1]
    features.value[index + 1] = temp
  }
}

const moveCompetitor = (index: number, direction: 'up' | 'down') => {
  if (direction === 'up' && index > 0) {
    const temp = competitors.value[index]
    competitors.value[index] = competitors.value[index - 1]
    competitors.value[index - 1] = temp
  } else if (direction === 'down' && index < competitors.value.length - 1) {
    const temp = competitors.value[index]
    competitors.value[index] = competitors.value[index + 1]
    competitors.value[index + 1] = temp
  }
}

watch(
  [features, competitors],
  () => {
    const content = {
      features: features.value,
      competitors: competitors.value,
    }
    plugin?.actions?.setContent(content)
  },
  { deep: true }
)
</script>

<template>
  <div class="flex flex-col">
    <div v-for="(feature, index) in features" :key="feature.id" class="flex flex-col">
      <div class="flex flex-row">
        <span class="sb-textfield__container mt-auto">
          <SbTextField
            :id="'feature-' + feature.id"
            :name="'feature-' + feature.id"
            :label="'Feature ' + (index + 1)"
            :maxlength="maxFeatureLen"
            placeholder="Feature name"
            v-model="feature.name"
          />
        </span>
        
        <SbButton v-if="features.length > 1" class="remove-button mt-auto sb-ml-0" size="small" @click="removeFeature(index)">
          <SbIcon name="trash" /> 
        </SbButton>

        <SbButton v-if="index > 0" class="mt-auto sb-ml-0" size="small" @click="moveFeature(index, 'up')">
          <SbIcon name="arrow-up" />
        </SbButton>

        <SbButton v-if="index < features.length - 1" class="mt-auto sb-ml-0" size="small" @click="moveFeature(index, 'down')">
          <SbIcon name="arrow-down" />
        </SbButton>
      </div>
    </div>
    <SbButton size="small" @click="addFeature">
      <SbIcon name="plus" /> Add Feature
    </SbButton>
    <SbSeparator v-bind="{}" />
    <div v-for="(competitor, compIndex) in competitors" :key="competitor.id" class="flex flex-col">
      <div class="flex flex-row">
        <span class="sb-textfield__container mt-auto">
          <SbTextField
            :id="'competitor-' + competitor.id"
            :name="'competitor-' + competitor.id"
            :label="'Competitor ' + (compIndex + 1)"
            placeholder="Competitor name"
            v-model="competitor.name"
          />
        </span>
        
        <SbButton v-if="competitors.length > 1" class="remove-button mt-auto sb-ml-0" size="small" @click="removeCompetitor(compIndex)">
          <SbIcon name="trash" /> 
        </SbButton>

        <SbButton v-if="compIndex > 0" class="mt-auto sb-ml-0" size="small" @click="moveCompetitor(compIndex, 'up')">
          <SbIcon name="arrow-up" />
        </SbButton>

        <SbButton v-if="compIndex < competitors.length - 1" class="mt-auto sb-ml-0" size="small" @click="moveCompetitor(compIndex, 'down')">
          <SbIcon name="arrow-down" />
        </SbButton>
      </div>
      <div class="flex">
        <SbCheckbox
          :id="'highlight-' + competitor.id"
          :name="'highlight-' + competitor.id"
          v-model="competitor.highlight"
          class="m-auto sb-ml-1"
          label="Highlight Competitor"
        />
      </div>
      <SbSeparator v-bind="{}" />
      <div v-for="(feature, featIndex) in features" :key="feature.id + '-' + competitor.id">
        <SbToggle
          :id="'toggle-' + feature.id + '-' + competitor.id"
          :name="'toggle-' + feature.id + '-' + competitor.id"
          :label="feature.name || 'Feature ' + (featIndex + 1)"
          :showLabel="true"
          v-model="competitor[feature.id]"
        />
      </div>
      <SbSeparator v-bind="{}" />
    </div>
    <SbButton size="small" @click="addCompetitor">
      <SbIcon name="plus" /> Add Competitor
    </SbButton>
  </div>
</template>
