import { debounce } from '../_thirdparty/lodash/timers.js'

const DEBOUNCE_DELAY = 700

const listeners = new Set()

if (process.env.BROWSER) {
  window.__resizeListeners = listeners
}

if (process.env.BROWSER) {
  window.addEventListener('resize', debounce(() => {
    console.log('resize')
    listeners.forEach(listener => listener())
  }, DEBOUNCE_DELAY))
}

export function registerResizeListener (listener) {
  listeners.add(listener)
}

export function unregisterResizeListener (listener) {
  listeners.delete(listener)
}
