import Vue from 'vue';
import App from './App.vue';
import './assets/css/bootstrap.min.css';  // 引入 Bootstrap
import './assets/css/icon.css';  // 引入字体图标
import routes from 'vue-router';
import ocrPage from '@/components/ocr-page';  // OCR识别页
import translationPage from '@/components/translation-page';  // 翻译页
import optionsPage from '@/components/options-page';  // 选项页
import historyPage from '@/components/history-page';  // 历史记录页
import aboutPage from '@/components/about-page';  // 关于页
import tessdataPage from '@/components/tessdata-page';  // tessdata模型文件管理页
import favoritesPage from '@/components/favorites-page';
import Vuex from 'vuex';

Vue.use(routes);
Vue.use(Vuex);
Vue.config.productionTip = false;

const router = new routes({
  routes: [
    {
      path: '/',
      component: ocrPage,
      name: 'ocrPage'
    },
    {
      path: '/translation-page',
      component: translationPage,
      name: 'translationPage'
    },
    {
      path: '/options-page',
      component: optionsPage,
      name: 'optionsPage'
    },
    {
      path: '/history-page',
      component: historyPage,
      name: 'historyPage'
    },
    {
      path: '/about-page',
      component: aboutPage,
      name: 'aboutPage'
    },
    {
      path: '/favorites-page',
      component: favoritesPage,
      name: 'favoritesPage'
    },
    {
      path: '/tessdata-page',
      component: tessdataPage,
      name: 'tessdataPage'
    }
  ]
});

const store = new Vuex.Store({
  state: {
    options: null,
    ocrResult: null,
    translation: null,
    auto: '',
    translationResult: null
  },
  mutations: {
    // 更改翻译结果
    changeTranslationResult(state, result) {
      state.translationResult = result
    },
    // 更改选项
    changeOptions(state, optionsObj) {
      state.options = optionsObj;
    },
    // 更改 OCR 结果
    changeOcrResult(state, result) {
      state.ocrResult = result;
    },
    // 更改翻译内容
    changeTranslation(state, text) {
      state.translation = text;
    },
    changeAuto(state, val) {
      state.auto = val;
    }
  }
});

new Vue({
  store,
  router,
  render: h => h(App),
}).$mount('#app');
