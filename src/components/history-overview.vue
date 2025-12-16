<template>
  <div id="history-overview">
    <!--百度OCR 记录-->
    <h2 class="mb-3">百度 OCR 记录</h2>
    <div class="row">
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-for="(item, index) of baidu" :key="index">
        <div class="data-box">
          <h3 class="text-center">{{item.count}}</h3>
          <p class="text-center mb-2">{{item.name}}</p>
        </div>
      </div>
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-if="baidu.length">
        <div class="data-box" tabindex="0" role="button" @click="deleteOcrHistory('baidu')">
          <h3 class="text-center">删除</h3>
          <p class="text-center mb-2">删除百度OCR数据</p>
        </div>
      </div>
    </div>
    <hr>
    <!--腾讯OCR记录-->
    <h2 class="mb-3">腾讯 OCR 记录</h2>
    <div class="row">
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-for="(item, index) of tencent" :key="index">
        <div class="data-box">
          <h3 class="text-center">{{item.count}}</h3>
          <p class="text-center mb-2">{{item.name}}</p>
        </div>
      </div>
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-if="baidu.length">
        <div class="data-box" tabindex="0" role="button" @click="deleteOcrHistory('tencent')">
          <h3 class="text-center">删除</h3>
          <p class="text-center mb-2">删除腾讯OCR数据</p>
        </div>
      </div>
    </div>
    <hr>
    <!--讯飞OCR记录-->
    <h2 class="mb-3">科大讯飞 OCR 记录</h2>
    <div class="row">
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-for="(item, index) of xunfei" :key="index">
        <div class="data-box">
          <h3 class="text-center">{{item.count}}</h3>
          <p class="text-center mb-2">{{item.name}}</p>
        </div>
      </div>
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-if="xunfei.length">
        <div class="data-box" tabindex="0" role="button" @click="deleteOcrHistory('xunfei')">
          <h3 class="text-center">删除</h3>
          <p class="text-center mb-2">删除讯飞OCR数据</p>
        </div>
      </div>
    </div>
    <hr>
    <!--有道OCR记录-->
    <h2 class="mb-3">有道智云 OCR 记录</h2>
    <div class="row">
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-for="(item, index) of youdao" :key="index">
        <div class="data-box">
          <h3 class="text-center">{{item.count}}</h3>
          <p class="text-center mb-2">{{item.name}}</p>
        </div>
      </div>
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-if="xunfei.length">
        <div class="data-box" tabindex="0" role="button" @click="deleteOcrHistory('youdao')">
          <h3 class="text-center">删除</h3>
          <p class="text-center mb-2">删除有道OCR数据</p>
        </div>
      </div>
    </div>
    <hr>
    <!--百度翻译记录-->
    <h2 class="mb-3">百度翻译记录</h2>
    <div class="row">
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-for="(item, index) of baiduTranslation" :key="index">
        <div class="data-box">
          <h3 class="text-center">{{item.count}}</h3>
          <p class="text-center mb-2">{{item.name}}</p>
        </div>
      </div>
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-if="baiduTranslation.length">
        <div class="data-box" @click="deleteAllTranslationHistory('baidu')" tabindex="0" role="button">
          <h3 class="text-center">删除</h3>
          <p class="text-center mb-2">删除百度翻译数据</p>
        </div>
      </div>
    </div>
    <hr>
    <!--腾讯翻译记录-->
    <h2 class="mb-3">腾讯翻译记录</h2>
    <div class="row">
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-for="(item, index) of tencentTranslation" :key="index">
        <div class="data-box">
          <h3 class="text-center">{{item.count}}</h3>
          <p class="text-center mb-2">{{item.name}}</p>
        </div>
      </div>
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-if="tencentTranslation.length">
        <div class="data-box" @click="deleteAllTranslationHistory('tencent')" tabindex="0" role="button">
          <h3 class="text-center">删除</h3>
          <p class="text-center mb-2">删除腾讯翻译数据</p>
        </div>
      </div>
    </div>
    <hr>
    <!--讯飞翻译记录-->
    <h2 class="mb-3">讯飞翻译记录</h2>
    <div class="row">
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-for="(item, index) of xunfeiTranslation" :key="index">
        <div class="data-box">
          <h3 class="text-center">{{item.count}}</h3>
          <p class="text-center mb-2">{{item.name}}</p>
        </div>
      </div>
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-if="xunfeiTranslation.length">
        <div class="data-box" @click="deleteAllTranslationHistory('xunfei')" tabindex="0" role="button">
          <h3 class="text-center">删除</h3>
          <p class="text-center mb-2">删除讯飞翻译数据</p>
        </div>
      </div>
    </div>
    <hr>
    <!--有道翻译记录-->
    <h2 class="mb-3">有道翻译记录</h2>
    <div class="row">
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-for="(item, index) of youdaoTranslation" :key="index">
        <div class="data-box">
          <h3 class="text-center">{{item.count}}</h3>
          <p class="text-center mb-2">{{item.name}}</p>
        </div>
      </div>
      <div class="col-lg-3 col-xl-2 col-md-4 mb-3" v-if="youdaoTranslation.length">
        <div class="data-box" @click="deleteAllTranslationHistory('youdao')" tabindex="0" role="button">
          <h3 class="text-center">删除</h3>
          <p class="text-center mb-2">删除有道翻译数据</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'history-overview',
  data() {
    return {
      baidu: [],
      tencent: [],
      xunfei: [],
      youdao: [],
      baiduTranslation: [],
      tencentTranslation: [],
      xunfeiTranslation: [],
      youdaoTranslation: []
    }
  },
  methods: {
    /**
     * 获取各 OCR 提供商的历史记录统计数据
     * @returns {void}
     */
    getOcrData() {
      window.electronAPI.ipcRenderer.invoke('ocrHistoryOverview').then(result => {
        this.baidu = result.baidu;
        this.tencent = result.tencent;
        this.xunfei = result.xunfei;
        this.youdao = result.youdao;
      });
    },
    /**
     * 删除指定 OCR 提供商的所有历史记录，删除前有确认步骤
     * @param {string} provider OCR 提供商名称（'baidu', 'tencent', 'xunfei', 'youdao'）
     * @returns {Promise<void|false>} 无数据或用户取消则返回 false，删除成功时返回 void
     */
    async deleteOcrHistory(provider) {
      // 检查是否有数据
      let count = 0;
      this[provider].forEach(val => {
        count += val.count;
      });
      if (count < 1) return false;

      // 删除确认
      const providerName = {baidu: '百度', tencent: '腾讯', xunfei: '讯飞', youdao: '有道'};
      const result = await window.electronAPI.ipcRenderer.invoke('dialog', {
        name: 'showMessageBox',
        options: {
          title: '删除确认',
          message: `'您确定要删除所有 ${providerName[provider]} OCR 历史记录吗，删除后无法恢复？`,
          buttons: ['取消', '确定删除'],
          type: 'warning',
          noLink: true
        }
      });
      if (result.response !== 1) return false;

      // 删除
      const deleteResult = await window.electronAPI.ipcRenderer.invoke('deleteOcrHistory', provider);
      // 删除出错
      if (deleteResult.result !== 'success') {
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '删除数据出错',
            message: deleteResult.msg,
            buttons: ['关闭'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }
      await window.electronAPI.ipcRenderer.invoke('dialog', {
        name: 'showMessageBox',
        options: {
          title: '删除完成',
          message: `已删除 ${deleteResult.count} 条 OCR 记录`,
          buttons: ['关闭'],
          type: 'info',
          noLink: true
        }
      });
      // 重新加载 OCR 记录
      this.getOcrData();
    },
    /**
     * 获取各翻译提供商的历史记录统计数据
     * @returns {void}
     */
    getTranslationData() {
      window.electronAPI.ipcRenderer.invoke('translationHistoryOverview').then(result => {
        this.baiduTranslation = result.baidu;
        this.tencentTranslation = result.tencent;
        this.xunfeiTranslation = result.xunfei;
        this.youdaoTranslation = result.youdao;
      });
    },
    /**
     * 删除指定翻译提供商的所有历史记录，删除前有确认步骤
     * @param {string} provider 翻译提供商名称（'baidu', 'tencent', 'xunfei', 'youdao'）
     * @returns {Promise<void|false>} 無數据或用户取消则返回 false，删除成功时返回 void
     */
    async deleteAllTranslationHistory(provider) {
      // 如果没有数据
      if (this[`${provider}Translation`][0].count < 1) return false;
      const providerName = {baidu: '百度翻译', tencent: '腾讯翻译', xunfei: '讯飞翻译', youdao: '有道翻译'};
      // 删除确认
      const btnResult = await window.electronAPI.ipcRenderer.invoke('dialog', {
        name: 'showMessageBox',
        options: {
          title: '删除确认',
          message: `您确定要删除 ${providerName[provider]} 历史记录吗，删除后无法恢复？`,
          buttons: ['取消', '确定删除'],
          type: 'warning',
          noLink: true
        }
      });
      if (btnResult.response !== 1) return false;
      // 删除
      const deleteResult = await window.electronAPI.ipcRenderer.invoke('deleteAllTranslationHistory', provider);
      // 删除出错
      if (deleteResult.result !== 'success') {
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '删除数据出错',
            message: deleteResult.msg,
            buttons: ['关闭'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }

      window.electronAPI.ipcRenderer.invoke('dialog', {
        name: 'showMessageBox',
        options: {
          title: '删除完成',
          message: `已删除 ${deleteResult.count} 条 ${providerName[provider]} 记录`,
          buttons: ['关闭'],
          type: 'info',
          noLink: true
        }
      });
      // 重新加载翻译记录
      this.getTranslationData();
    }
  },
  created() {
    this.getOcrData();
    this.getTranslationData();
  }
}
</script>

<style scoped>
/*卡片区域*/
#history-overview .data-box {
  background: #E7EAED;
  height: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
}
#history-overview h2 {
  font-size: 22px;
}
</style>