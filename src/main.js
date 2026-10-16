/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'
import { getAnalytics } from 'firebase/analytics'

// Plugins
import { registerPlugins } from '@/plugins'
import { app, auth } from '@/firebase'
import { initAuth } from '@/composables/useAuth'
import { initTheme } from '@/composables/useTheme'
import { initPwaUpdate } from '@/composables/usePwaUpdate'
import { setAuthGetter } from '@/services/server'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'
import 'vue-sonner/style.css'
import '@/styles/style.css'

getAnalytics(app)
initAuth()
initTheme()

setAuthGetter(async () => {
  const user = auth.currentUser
  return user ? await user.getIdToken() : null
})

initPwaUpdate()

const vueApp = createApp(App)

registerPlugins(vueApp)

vueApp.mount('#app')
