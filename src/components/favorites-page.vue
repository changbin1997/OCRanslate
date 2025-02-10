<template>
  <div id="favorites-page" class="p-3">
    <h2 class="text-center py-3">共包含 {{count}} 条收藏</h2>
    <div id="favorites-list">
      <div v-for="(item, index) of list" :key="index" class="border-bottom mb-3">
        <div class="mb-2">
          <button class="btn btn-outline-primary btn-sm me-2">
            <span>{{languageName(item.from, item.provider)}}</span>
            <i class="icon-arrow-right2 mx-2"></i>
            <span>{{languageName(item.to, item.provider)}}</span>
          </button>
          <span class="me-2">{{item.created}}</span>
          <span>来自{{providerName[item.provider]}}</span>
          <button class="btn btn-light btn-sm float-end" @click="deleteFavorite(index)">删除</button>
        </div>
        <div class="row">
          <div class="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
            <p class="mb-1" v-for="(src, srcIndex) of item.src" :key="srcIndex">{{src}}</p>
            <div class="mb-2">
              <button type="button" class="btn btn-light btn-sm me-2" @click="copyText('src', index)">
                <i class="icon-copy me-2"></i>
                <span>拷贝</span>
              </button>
              <button type="button" class="btn btn-light btn-sm" :disabled="btnDisabled" @click="startVoice('src', index, item.from)">
                <i class="icon-volume-medium me-2"></i>
                <span>朗读</span>
              </button>
            </div>
          </div>
          <div class="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
            <p class="mb-1" v-for="(dst, dstIndex) of item.dst" :key="dstIndex">{{dst}}</p>
            <div class="mb-3">
              <button type="button" class="btn btn-light btn-sm me-2" @click="copyText('dst', index)">
                <i class="icon-copy me-2"></i>
                <span>拷贝</span>
              </button>
              <button type="button" class="btn btn-light btn-sm" :disabled="btnDisabled" @click="startVoice('dst', index, item.to)">
                <i class="icon-volume-medium me-2"></i>
                <span>朗读</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <nav class="page-nav-box text-center py-2" v-if="count > 0">
      <div class="btn-group btn-group-sm">
        <button type="button" class="btn btn-outline-primary" @click="previousPage" :disabled="page <= 1">上一页</button>
        <button type="button" class="btn btn-outline-primary">{{page}}/{{pageCount}}</button>
        <button type="button" class="btn btn-outline-primary" @click="nextPage" :disabled="page * 10 >= count">下一页</button>
      </div>
    </nav>
  </div>
</template>

<script>
import Voice from './../modules/voice';
import languageList from './../modules/language-list';

export default {
  name: 'favorites-page',
  data() {
    return {
      count: 0,
      page: 1,
      list: [],
      btnDisabled: false,
      voice: null,
      providerName: {baidu: '百度翻译', tencent: '腾讯翻译', xunfei: '讯飞翻译', youdao: '有道翻译'}
    }
  },
  computed: {
    // 总页数
    pageCount() {
      return Math.ceil(this.count / 10);
    }
  },
  methods: {
    // 删除收藏
    async deleteFavorite(index) {
      const result = await window.electronAPI.ipcRenderer.invoke('dialog', {
        name: 'showMessageBox',
        options: {
          title: '删除确认',
          message: `您确定要删除 ${this.list[index].created} 的收藏吗，删除后无法恢复？`,
          buttons: ['取消', '确定删除'],
          type: 'warning',
          noLink: true
        }
      });
      if (result.response !== 1) return false;
      const deleteResult = await window.electronAPI.ipcRenderer.invoke('deleteFavorite', this.list[index].id);
      // 删除出错
      if (deleteResult.result !== 'success') {
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '删除数据错误',
            message: deleteResult.msg,
            buttons: ['关闭'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }

      this.count --;
      this.list.splice(index, 1);

      if (this.page >= this.pageCount && this.list.length < 1) {
        // 如果本页已全部删完就往前跳一页
        this.previousPage();
      }else {
        // 如果不是最后一页就重新加载
        this.getFavorites();
      }
    },
    // 通过语言代码获取语言名称
    languageName(code, provider) {
      const language = languageList[provider].languageList2.find(item => item.code === code);
      if (language === undefined) {
        return code;
      }else {
        return language.name;
      }
    },
    // 语音朗读
    startVoice(type, index, language) {
      // 获取朗读文本
      const text = this.list[index][type].join("\n");
      // 寻找指定语言的语音库
      if (!this.voice.changeLanguage(language)) {
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '没有适合的语音库',
            message: `您的电脑上缺少 ${this.languageName(language, this.list[index].provider)} 的语音库！`,
            buttons: ['关闭'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }
      // 开始朗读
      this.voice.start({
        text: text,
        start: () => {
          // 开始朗读后禁用朗读按钮
          this.btnDisabled = true;
        },
        stop: () => {
          // 停止朗读后恢复朗读按钮
          this.btnDisabled = false;
        }
      });
    },
    // 拷贝文本
    copyText(type, index) {
      // 获取拷贝的文本
      const text = this.list[index][type].join("\n");
      // 发送拷贝请求
      window.electronAPI.ipcRenderer.invoke('copy-text', text);
    },
    // 上一页
    previousPage() {
      if (this.page <= 1) return false;
      this.page --;
      this.getFavorites();
    },
    // 下一页
    nextPage() {
      if (this.page * 10 >= this.count) return false;
      this.page ++;
      this.getFavorites();
    },
    // 获取收藏
    async getFavorites() {
      // 发送 IPC 请求
      const result = await window.electronAPI.ipcRenderer.invoke('getFavorites', this.page * 10 - 10);
      // 查询出错
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
      for (let i = 0;i < result.list.length;i ++) {
        // 把原文和译文拆分为数组
        result.list[i].src = result.list[i].src.split("\n");
        result.list[i].dst = result.list[i].dst.split("\n");
      }
      this.list = result.list;
    }
  },
  created() {
    document.title = '收藏 - OCRanslate';
    // 获取收藏
    this.getFavorites();
    // 初始化语音朗读
    this.voice = new Voice();
  }
}
</script>

<style scoped>
#favorites-page {
  height: 100%;
  overflow-y: auto;
  -webkit-user-select: none;
  user-select: none;
}
</style>