<template>
  <div id="app">
    <sidebar />
    <div id="page">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import sidebar from '@/components/sidebar';

export default {
  name: 'App',
  components: {
    sidebar
  },
  methods: {
    /**
     * 获取选项
     * @returns {Promise<void>}
     */
    async getOptions() {
      const options = await window.electronAPI.ipcRenderer.invoke('getOptions');
      if (options.result !== 'success') {
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '查询数据出错',
            message: options.msg,
            buttons: ['关闭'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }
      this.$store.commit('changeOptions', options.options);
    }
  },
  created() {
    this.getOptions();
  },
  mounted() {
    // 接收快捷键调用的 OCR 结果
    window.electronAPI.onResponse('ocrResult', (ev, args) => {
      if (args.result === 'success' && args.img !== undefined && args.list !== undefined) {
        // 更改 vuex 存储的自动执行
        this.$store.commit('changeAuto', args.auto);
        this.$store.commit('changeOcrResult', args);
        this.$router.push({
          name: 'ocrPage',
          query: {
            ocrResult: 'xxx',
            time: String(Date.parse(new Date()))
          }
        });
      }
    });
    // 跳转到指定页面
    window.electronAPI.onResponse('toPage', (ev, args) => {
      this.$router.push({name: args});
    });
    // 剪贴板翻译
    window.electronAPI.onResponse('clipboardTranslation', (ev, args) => {
      // 设置翻译内容
      this.$store.commit('changeTranslation', args);
      // 设置翻译的自动执行
      this.$store.commit('changeAuto', '识别完成后自动翻译和朗读译文');
      // 转到翻译页
      this.$router.push({
        name: 'translationPage',
        query: {ocrTranslation: args.length}
      });
    });
  }
}
</script>

<style>
html {
  height: 100%;
}
body {
  height: 100%;
}
#app {
  height: 100%;
  display: flex;
  justify-content: flex-start;
}
#page {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  height: 100%;
}
</style>
