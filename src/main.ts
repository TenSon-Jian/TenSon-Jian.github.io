import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { initTheme } from './composables/useTheme'
import './styles/main.scss'

initTheme()

const app = createApp(App)

app.use(router)

app.mount('#app')
