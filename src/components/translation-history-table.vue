<template>
  <div id="translation-history-table">
    <h2 class="text-center py-3">共包含 {{count}} 条记录</h2>
    <table class="table table-bordered table-striped table-hover">
      <thead>
      <tr>
        <th>提供商</th>
        <th>字数</th>
        <th>时间</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(item, index) of translationList" :key="index">
        <td>{{providerName[item.provider]}}</td>
        <td>{{item.word_count}}</td>
        <td>{{item.translation_time}}</td>
      </tr>
      </tbody>
    </table>
    <nav class="page-nav-box text-center py-2" v-if="count">
      <div class="btn-group btn-group-sm">
        <button type="button" class="btn btn-outline-primary" :disabled="pageNum === 1" @click="previousPage">上一页</button>
        <button type="button" class="btn btn-outline-primary">{{pageNum}}/{{pageCount}}</button>
        <button type="button" class="btn btn-outline-primary" :disabled="pageNum >= pageCount" @click="nextPage">下一页</button>
      </div>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'translation-history-table',
  data() {
    return {
      count: 0,
      translationList: [],
      pageCount: 0,
      pageNum: 1,
      providerName: {baidu: '百度翻译', tencent: '腾讯翻译', xunfei: '讯飞翻译', youdao: '有道翻译'}
    }
  },
  methods: {
    /**
     * 获取翻译历史记录列表
     * @returns {Promise<void|false>} 获取失败返回 false，成功时无返回值
     */
    async getTranslationHistoryList() {
      // 要提交的数据
      const submitData = {
        start: this.pageNum * 20 - 20,
        count: 20
      };
      // 发送请求
      const result = await window.electronAPI.ipcRenderer.invoke('translationHistoryList', submitData);
      // 出错
      if (result.result !== 'success') {
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '查询数据出错',
            message: result.msg,
            buttons: ['关闭'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }
      this.count = result.count;
      this.translationList = result.list;
      // 计算总页数
      this.pageCount = Math.ceil(this.count / 20);
    },
    /**
     * 翻到下一页，并重新获取翻译历史记录
     * @returns {void}
     */
    nextPage() {
      this.pageNum ++;
      this.getTranslationHistoryList()
    },
    /**
     * 翻到上一页，并重新获取翻译历史记录
     * @returns {void}
     */
    previousPage() {
      this.pageNum --;
      this.getTranslationHistoryList()
    }
  },
  created() {
    this.getTranslationHistoryList();
  }
}
</script>