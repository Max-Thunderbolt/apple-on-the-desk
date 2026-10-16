import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ClassFloatingBar from '@/components/class/ClassFloatingBar.vue'
import { vuetifyPlugin } from './setup-vuetify'

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function mountBar() {
  return mount(ClassFloatingBar, {
    props: { viewShopModal: false },
    global: { plugins: [vuetifyPlugin()] },
    attachTo: document.body,
  })
}

async function clickTimerButton(wrapper) {
  const btn = wrapper.findAll('.toolbarBtn').find((b) => b.attributes('aria-label') === 'Timer')
  await btn.trigger('click')
  await nextTick()
}

function controlButton(wrapper, label) {
  return wrapper.findAll('.timerFooterPanel button').find((b) => b.text() === label)
}

function timeText(wrapper) {
  return wrapper.vm.timerRef.formattedTime
}

describe('Class toolbar timer', () => {
  let playSpy

  beforeEach(() => {
    vi.useFakeTimers()
    playSpy = vi.spyOn(globalThis.Audio.prototype, 'play').mockResolvedValue()
  })

  afterEach(() => {
    vi.useRealTimers()
    playSpy.mockRestore()
    document.body.innerHTML = ''
  })

  it('opens a panel with presets, custom field and controls', async () => {
    const wrapper = mountBar()
    await clickTimerButton(wrapper)

    expect(wrapper.findAll('.presetChip').map((c) => c.text())).toEqual(['30s', '1m', '2m', '5m'])
    expect(wrapper.find('.timerCustomInput input').exists()).toBe(true)
    expect(controlButton(wrapper, 'Start')).toBeTruthy()
    expect(controlButton(wrapper, 'Stop')).toBeTruthy()
    expect(controlButton(wrapper, 'Reset')).toBeTruthy()
    wrapper.unmount()
  })

  it('keeps running after the panel closes and shows the collapsed chip', async () => {
    const wrapper = mountBar()
    await clickTimerButton(wrapper)
    await wrapper.findAll('.presetChip')[0].trigger('click') // 30s
    await controlButton(wrapper, 'Start').trigger('click')

    await vi.advanceTimersByTimeAsync(3000)
    expect(timeText(wrapper)).toBe('00:27')

    await clickTimerButton(wrapper) // close
    await vi.advanceTimersByTimeAsync(2000)
    expect(timeText(wrapper)).toBe('00:25')
    const chip = wrapper.find('.toolbarTimerChip')
    expect(chip.exists()).toBe(true)
    expect(chip.find('.timerChipTime').text()).toBe('00:25')

    await chip.trigger('click') // reopen shows live state
    await nextTick()
    expect(wrapper.find('.timerFooterPanel').exists()).toBe(true)
    expect(wrapper.find('.toolbarTimerChip').exists()).toBe(false)
    wrapper.unmount()
  })

  it('ignores a second Start, freezes on Stop, resumes and resets', async () => {
    const wrapper = mountBar()
    await clickTimerButton(wrapper)
    // default 120s
    await controlButton(wrapper, 'Start').trigger('click')
    await controlButton(wrapper, 'Start').trigger('click')
    await vi.advanceTimersByTimeAsync(5000)
    expect(timeText(wrapper)).toBe('01:55')

    await controlButton(wrapper, 'Stop').trigger('click')
    await vi.advanceTimersByTimeAsync(3000)
    expect(timeText(wrapper)).toBe('01:55')

    await controlButton(wrapper, 'Start').trigger('click')
    await vi.advanceTimersByTimeAsync(1000)
    expect(timeText(wrapper)).toBe('01:54')

    await controlButton(wrapper, 'Reset').trigger('click')
    await vi.advanceTimersByTimeAsync(2000)
    expect(timeText(wrapper)).toBe('02:00')
    expect(wrapper.vm.timerRef.isRunning).toBe(false)
    wrapper.unmount()
  })

  it('runs a custom duration and disables Start for empty or 0', async () => {
    const wrapper = mountBar()
    await clickTimerButton(wrapper)
    const input = wrapper.find('.timerCustomInput input')

    await input.setValue('0')
    expect(controlButton(wrapper, 'Start').attributes('disabled')).toBeDefined()
    await input.setValue('')
    expect(controlButton(wrapper, 'Start').attributes('disabled')).toBeDefined()

    await input.setValue('45')
    expect(controlButton(wrapper, 'Start').attributes('disabled')).toBeUndefined()
    await controlButton(wrapper, 'Start').trigger('click')
    await vi.advanceTimersByTimeAsync(45000)
    expect(playSpy).not.toHaveBeenCalled()
    expect(timeText(wrapper)).toBe('00:00')
    await vi.advanceTimersByTimeAsync(1000)
    expect(playSpy).toHaveBeenCalledTimes(1) // loops: swap sound, then restarts
    expect(timeText(wrapper)).toBe('00:44')
    wrapper.unmount()
  })

  it('clears the interval when the class page unmounts', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const wrapper = mountBar()
    await clickTimerButton(wrapper)
    await controlButton(wrapper, 'Start').trigger('click')
    wrapper.unmount()
    expect(clearSpy).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    clearSpy.mockRestore()
  })
})
