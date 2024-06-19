import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { describe, test, expect } from 'vitest'
import { setupFieldPlugin } from '@storyblok/field-plugin/test'
import { nextTick } from 'vue'
import FieldPlugin from './index.vue'

describe('FieldPluginExample', async () => {
  test('should render the component', async () => {
    const { cleanUp } = setupFieldPlugin()
    // We wait for `nextTick` because it takes a moment
    // for `plugin.type` to become `loaded`.
    // After that, we can start testing the behaviors.
    render(FieldPlugin) // plugin.type === 'loading'
    await nextTick() // plugin.type === 'loaded'

    // const headline = screen.getByText('Field Value')
    // expect(headline).toBeInTheDocument()
    cleanUp()
  })

  test('should increase the counter', async () => {
    const { cleanUp } = setupFieldPlugin()
    const user = userEvent.setup()
    // We wait for `nextTick` because it takes a moment
    // for `plugin.type` to become `loaded`.
    // After that, we can start testing the behaviors.
    render(FieldPlugin) // plugin.type === 'loading'
    await nextTick() // plugin.type === 'loaded'
    const toggle = screen.getByTestId('toggle') as HTMLInputElement
    expect(toggle.checked).toEqual(false)
    await user.click(toggle)
    expect(toggle.checked).toEqual(true)
    // await user.click(screen.getByText('Increment'))
    // expect(screen.getByTestId('count').textContent).toEqual('2')
    cleanUp()
  })
})
