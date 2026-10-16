import vuetify from 'eslint-config-vuetify'
import eslintConfigPrettier from 'eslint-config-prettier'

// eslint-config-vuetify@4 returns a flat-config composer (a promise), not an array: pass extra configs in.
export default vuetify({}, eslintConfigPrettier)
