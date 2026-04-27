/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'
import { app, auth } from '@/firebase'
import { getAnalytics } from 'firebase/analytics'
import { initAuth } from '@/composables/useAuth'
import { initTheme } from '@/composables/useTheme'
import { setAuthGetter } from '@/services/server'

getAnalytics(app)
initAuth()
initTheme()

setAuthGetter(async () => {
  const user = auth.currentUser
  return user ? await user.getIdToken() : null
})

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Styles
import 'unfonts.css'
import '@/styles/style.css'

const vueApp = createApp(App)

registerPlugins(vueApp)

vueApp.mount('#app')
