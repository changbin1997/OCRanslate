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
    },
    /**
     * 播放音效
     * @param {string} audioFilePath 音频文件路径
     */
    playSound(audioFilePath) {
      const audio = new Audio(audioFilePath);
      audio.volume = 0.7;
      audio.play();
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

    // 接收截图自动翻译和剪贴板翻译的结果
    window.electronAPI.onResponse('translationResult', (ev, args) => {
      // 把翻译结果传给 vuex，方便翻译页面获取显示
      this.$store.commit('changeTranslationResult', args.data);
      // 转到翻译页
      this.$router.push({
        name: 'translationPage',
        query: {type: '显示翻译结果', timestamp: String(new Date().getTime())}
      });
    });

    // 播放音效
    window.electronAPI.onResponse('playSound', (ev, args) => {
      this.playSound(args);
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
