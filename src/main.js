import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './router'
import { useThemeStore } from '@/stores/theme'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

const themeStore = useThemeStore(pinia)
themeStore.init()

app.mount('#app')

registerSW({ immediate: true })
