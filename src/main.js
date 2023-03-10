import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { firebaseApp } from './firebase'
import { VueFire } from 'vuefire'

createApp(App)
.use(VueFire, {
    firebaseApp,
    modules: [ ],
})
.mount('#app')
