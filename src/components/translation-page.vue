<template>
  <div id="translation-page">
    <div role="toolbar" class="toolbar px-1">
      <!--原文操作区域-->
      <div class="btn-group btn-box">
        <button type="button" title="清空原文和译文" class="btn" :disabled="originalText.length < 1 && resultText.length < 1" @click="clear">
          <i class="icon-cross me-1"></i>
          <span>清空</span>
        </button>
        <button type="button" title="朗读原文" class="btn" :disabled="originalText.length < 1 || disabledVoiceBtn" @click="startVoice(originalText, 'original')">
          <i class="icon-volume-medium me-1"></i>
          <span>朗读</span>
        </button>
        <button type="button" :class="{'text-primary': favorite}"  title="把本次翻译添加到收藏" class="btn" :disabled="translationResult === null || disabledVoiceBtn" @click="addToFavorites">
          <i class="icon-star-full me-1"></i>
          <span>收藏</span>
        </button>
      </div>
      <!--翻译语言选择区域-->
      <div class="language-box">
        <select class="form-select form-select-sm" v-model="languageSelected1" aria-label="原文语言" title="原文语言">
          <option v-for="(item, index) of languageList1" :key="index" v-bind:value="item.code">{{item.name}}</option>
        </select>
        <button type="button" class="btn btn-sm" aria-label="翻译" title="翻译" @click="submit" :disabled="disabledSubmitBtn">
          <i class="icon-arrow-right2"></i>
        </button>
        <select class="form-select form-select-sm" v-model="languageSelected2" aria-label="译文语言" title="译文语言">
          <option v-for="(item, index) of languageList2" :key="index" v-bind:value="item.code">{{item.name}}</option>
        </select>
      </div>
      <!--译文操作区域-->
      <div class="btn-group btn-box">
        <button type="button" title="朗读译文" class="btn" :disabled="resultText.length < 1 || disabledVoiceBtn" @click="startVoice(resultText, 'result')">
          <i class="icon-volume-medium me-1"></i>
          <span>朗读</span>
        </button>
        <button type="button" title="拷贝译文" class="btn" :disabled="resultText.length < 1" @click="copyText">
          <i class="icon-copy me-1"></i>
          <span>拷贝</span>
        </button>
        <button type="button" title="把本次翻译导出为 TXT 或 HTML" class="btn" @click="exportMenu" id="export-btn" :disabled="resultText.length < 1">
          <i class="icon-share me-1"></i>
          <span>导出</span>
        </button>
      </div>
    </div>
    <!--输入和译文显示区域-->
    <div class="text-box">
      <div class="original-box">
        <textarea @drop="dragFile" @dragover="preventDefault"  class="form-control border-0" placeholder="请输入要翻译的内容" aria-label="原文" v-model="originalText" @contextmenu="contextMenu"></textarea>
      </div>
      <div class="result-box">
        <textarea class="form-control border-top-0 border-bottom-0 border-end-0" aria-label="译文" v-model="resultText" aria-live="assertive" @contextmenu="contextMenu"></textarea>
      </div>
    </div>
  </div>
</template>

<script>
import Voice from './../modules/voice';
import languageList from './../modules/language-list';

export default {
  name: 'translation-page',
  data() {
    return {
      languageSelected1: 'auto',
      languageSelected2: 'zh',
      languageList1: languageList[this.$store.state.options.translationProvider].languageList1,
      languageList2: languageList[this.$store.state.options.translationProvider].languageList2,
      resultText: '',
      originalText: '',
      disabledSubmitBtn: false,
      voice: null,
      disabledVoiceBtn: false,
      available: false,
      translationResult: null,
      favorite: false,
      favoriteId: null
    }
  },
  methods: {
    /**
     * 删除已收藏的翻译记录
     * @returns {Promise<void|false>} 若无收藏 ID 或删除出错则返回 false，否则返回 void
     */
    async deleteFavorite() {
      if (this.favoriteId === null) return false;
      const deleteResult = await window.electronAPI.ipcRenderer.invoke('deleteFavorite', this.favoriteId);
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
          title: '完成',
          message: '您刚才添加到收藏的翻译已成功移除。',
          buttons: ['关闭'],
          type: 'info',
          noLink: true
        }
      });

      this.favoriteId = null;
      this.favorite = false;
    },
    /**
     * 添加翻译结果到收藏或从收藏中移除
     * @returns {Promise<void|false>} 若无翻译结果则返回 false，否则返回 void
     */
    async addToFavorites() {
      if (this.translationResult === null) return false;
      // 如果已经收藏就移除收藏
      if (this.favorite) {
        this.deleteFavorite();
      }else {
        // 设置翻译 API 提供商
        this.translationResult.provider = this.$store.state.options.translationProvider;
        // 发送 IPC 请求
        const result = await window.electronAPI.ipcRenderer.invoke('addToFavorites', this.translationResult);
        // 是否添加成功
        if (result.result === 'success') {
          window.electronAPI.ipcRenderer.invoke('dialog', {
            name: 'showMessageBox',
            options: {
              title: '完成',
              message: '本次翻译已添加到收藏，您可以在左侧的收藏中查看翻译收藏。',
              buttons: ['关闭'],
              type: 'info',
              noLink: true
            }
          });
          this.favorite = true;
          this.favoriteId = result.id;
        }else {
          window.electronAPI.ipcRenderer.invoke('dialog', {
            name: 'showMessageBox',
            options: {
              title: '添加数据出错',
              message: result.msg,
              buttons: ['关闭'],
              type: 'error',
              noLink: true
            }
          });
        }
      }
    },
    /**
     * 显示翻译结果导出菜单
     * @param {MouseEvent} ev 事件对象（未实际使用）
     * @returns {void|false} 若无翻译结果则返回 false，否则无返回值
     */
    exportMenu(ev) {
      if (this.translationResult === null) return false;
      // 获取翻译结果
      const exportResult = {
        to: this.translationResult.to,
        from: this.translationResult.from,
        trans_result: this.translationResult.trans_result
      };
      // 设置语言名称
      let from = this.languageList1.find(item => item.code === exportResult.from);
      // 如果找不到原文的语言名称
      if (from === undefined) from = {code: exportResult.from, name: exportResult.from};
      const to = this.languageList1.find(item => item.code === exportResult.to);
      exportResult.from = `${from.name}（${from.code}）`;
      exportResult.to = `${to.name}（${to.code}）`;
      // 获取菜单弹出的位置
      const rect = document.querySelector('#export-btn').getBoundingClientRect();
      window.electronAPI.ipcRenderer.send('exportTranslationMenu', {
        x: rect.left - 46,
        y: rect.top + rect.height,
        result: exportResult
      });
    },
    /**
     * 处理拖拽文件事件，将文件内容读取并作为原文
     * @param {DragEvent} ev 拖拽事件对象
     * @returns {void|false} 若文件过大或读取出错则返回 false，否则无返回值
     */
    dragFile(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      // 清空内容
      this.clear();
      // 获取文件
      const file = ev.dataTransfer.files[0];

      // 如果文件大小达到 10K 就显示警告
      if (file.size >= 10240 && file.size < 51200) {
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '文件过大',
            message: '您选择的文件大小已经达到 10KB，可能会超出百度翻译 API 的字符数限制！',
            buttons: ['知道了'],
            type: 'warning',
            noLink: true
          }
        });
      }else if (file.size >= 51200) {
        // 文件达到 50K 就不再往下执行
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '文件过大',
            message: '您选择的文件已经达到 50KB，已经超出了百度翻译 API 的字符数限制！',
            buttons: ['知道了'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }

      // 读取文件
      const reader = new FileReader();
      reader.readAsText(file);

      reader.addEventListener('load', fileEv => {
        this.originalText = fileEv.target.result;
      });
    },
    /**
     * 阻止拖拽相关事件的默认行为和冒泡
     * @param {Event} ev 事件对象
     * @returns {void}
     */
    preventDefault(ev) {
      ev.preventDefault();
      ev.stopPropagation();
    },
    /**
     * 提交翻译请求并处理翻译结果
     * @returns {Promise<void|false>} 若出错或无翻译内容则返回 false，否则返回 void
     */
    async submit() {
      // 重置翻译结果和翻译收藏
      this.translationResult = null;
      this.favorite = false;
      this.favoriteId = null;
      // 如果没有填写 API 密钥就弹出提示
      if (!this.available) {
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '没有填写 API 密钥',
            message: '您还没有填写百度翻译的 API 密钥信息，目前翻译功能暂不可用，请在设置中填写百度翻译的 API 密钥信息！',
            buttons: ['知道了'],
            type: 'info',
            noLink: true
          }
        });
        return false;
      }
      // 翻译内容是否为空
      if (this.originalText === '') {
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '翻译内容为空！',
            message: '翻译内容不能为空，请输入要翻译的内容！',
            buttons: ['关闭'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }
      // 原文语言和译文语言是否相同
      if (this.languageSelected1 === this.languageSelected2) {
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '原文语言和译文语言相同',
            message: '原文语言和译文语言不能选择同一种语言！',
            buttons: ['关闭'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }
      // 需要提交翻译的内容
      const submitData = {
        q: this.originalText,
        from: this.languageSelected1,
        to: this.languageSelected2,
        options: this.$store.state.options
      };
      // 禁用翻译按钮
      this.disabledSubmitBtn = true;
      // 提交翻译请求
      const result = await window.electronAPI.ipcRenderer.invoke('translation', submitData);
      this.disabledSubmitBtn = false;
      // 是否翻译出错
      if (result.result !== 'success') {
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '翻译出错',
            message: result.msg,
            buttons: ['关闭'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }
      // 显示译文
      const resultList = [];
      result.data.trans_result.forEach(val => {
        resultList.push(val.dst);
      });
      this.resultText = resultList.join("\n");
      this.translationResult = result.data;
      // 如果开启了翻译完成后自动朗读就朗读译文
      if (this.$store.state.auto === '识别完成后自动翻译和朗读译文' || this.$store.state.options.translationAutoVoice) {
        this.startVoice(this.resultText, 'result');
      }
      // 清除自动执行
      this.$store.commit('changeAuto', '');
    },
    /**
     * 清空翻译内容、结果、收藏状态和自动执行状态
     * @returns {void}
     */
    clear() {
      this.resultText = '';
      this.originalText = '';
      this.voice.stop();
      this.translationResult = null;
      this.favorite = false;
      this.favoriteId = null;
      this.$store.commit('changeAuto', '');
    },
    /**
     * 启动文本语音朗读，支持自动选择或指定语音库
     * @param {string} text 要朗读的文本内容
     * @param {string} type 朗读类型，'original' 为原文，'result' 为译文
     * @returns {void|false} 若无音频库或文本为空则返回 false，否则无返回值
     */
    startVoice(text, type) {
      if (text === '') return false;
      let language = '';

      // 如果设置了自动选择语音库
      if (this.$store.state.options.translationVoiceLibrarySelected === 'auto') {
        if (type === 'result') {
          // 获取译文语言名称
          if (this.translationResult === null) return false;
          language = this.languageList1.find(item => {
            return item.code === this.translationResult.to;
          });
        }else {
          // 获取原文语言名称
          if (this.languageSelected1 !== 'auto') {
            language = this.languageList1.find(item => item.code === this.languageSelected1);
          }else if (this.translationResult !== null) {
            language = this.languageList1.find(item => {
              return item.code === this.translationResult.from;
            });
            // 如果找不到原文语言
            if (language === undefined) {
              language = {code: this.translationResult.from, name: this.translationResult.from};
            }
          }else {
            window.electronAPI.ipcRenderer.invoke('dialog', {
              name: 'showMessageBox',
              options: {
                title: '原文语言未知',
                message: `请先选择原文语言或等待翻译完成后再收听原文朗读！`,
                buttons: ['关闭'],
                type: 'error',
                noLink: true
              }
            });
            return false;
          }
        }

        // 寻找指定语言的语音库
        if (!this.voice.changeLanguage(language.code)) {
          window.electronAPI.ipcRenderer.invoke('dialog', {
            name: 'showMessageBox',
            options: {
              title: '没有适合的语音库',
              message: `您的电脑上缺少 ${language.name} 的语音库！`,
              buttons: ['关闭'],
              type: 'error',
              noLink: true
            }
          });
          return false;
        }
      }else {
        // 指定语音库
        if (!this.voice.changeVoiceLibrary(this.$store.state.options.translationVoiceLibrarySelected)) {
          window.electronAPI.ipcRenderer.invoke('dialog', {
            name: 'showMessageBox',
            options: {
              title: '没有适合的语音库',
              message: `您设置的语音库 ${this.$store.state.options.translationVoiceLibrarySelected} 在您的电脑上无法找到！`,
              buttons: ['关闭'],
              type: 'error',
              noLink: true
            }
          });
          return false;
        }
      }

      // 开始朗读
      this.voice.start({
        text: text,
        start: () => {
          // 开始朗读后禁用朗读按钮
          this.disabledVoiceBtn = true;
        },
        stop: () => {
          // 停止朗读后恢复朗读按钮
          this.disabledVoiceBtn = false;
        }
      });
    },
    /**
     * 将译文复制到系统剪贴板
     * @returns {void|false} 若无译文则返回 false，否则无返回值
     */
    copyText() {
      if (this.resultText === '') return false;
      // 发送拷贝请求
      window.electronAPI.ipcRenderer.invoke('copy-text', this.resultText);
    },
    /**
     * 检查各翻译 API 提供商的密钥是否已填写
     * @returns {void}
     */
    apiInit() {
      // 检查百度 API 密钥
      if (
          this.$store.state.options.translationProvider === 'baidu' &&
          this.$store.state.options.baiduTranslationAppID !== '' &&
          this.$store.state.options.baiduTranslationApiKey !== ''
      ) {
        this.available = true;
      }
      // 检查腾讯 API 密钥
      if (
          this.$store.state.options.translationProvider === 'tencent' &&
          this.$store.state.options.tencentOcrAppID !== '' &&
          this.$store.state.options.tencentOcrSecretID !== '' &&
          this.$store.state.options.tencentOcrSecretKey !== ''
      ) {
        this.available = true;
      }
      // 检查讯飞 API 密钥
      if (
          this.$store.state.options.translationProvider === 'xunfei' &&
          this.$store.state.options.xunfeiOcrAPPId !== '' &&
          this.$store.state.options.xunfeiOcrAPISecret !== '' &&
          this.$store.state.options.xunfeiOcrAPIKey !== ''
      ) {
        this.available = true;
      }
      // 检查有道 API 密钥
      if (
          this.$store.state.options.translationProvider === 'youdao' &&
          this.$store.state.options.youdaoOcrAppID !== '' &&
          this.$store.state.options.youdaoOcrAppKey !== ''
      ) {
        this.available = true;
      }
      // 如果没有填写 API 密钥就弹出提示
      if (!this.available) {
        const providerName = {baidu: '百度翻译', tencent: '腾讯', xunfei: '讯飞', youdao: '有道'};
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '没有填写 API 密钥',
            message: `您当前使用的翻译引擎是 ${providerName[this.$store.state.options.translationProvider]}，您还没有填写 ${providerName[this.$store.state.options.translationProvider]} 的 API 密钥信息，请在设置中填写 ${providerName[this.$store.state.options.translationProvider]} 的 API 密钥信息！`,
            buttons: ['知道了'],
            type: 'info',
            noLink: true
          }
        });
      }
    },
    /**
     * 检查并执行自动翻译，通常由 OCR 识别完成后触发
     * @returns {void}
     */
    autoTranslation() {
      if (
          this.$route.query.ocrTranslation !== undefined &&
          this.$store.state.translation !== null &&
          Number(this.$route.query.ocrTranslation) === this.$store.state.translation.length
      ) {
        // 把 Vuex 中的需要翻译的内容添加到原文输入框
        this.originalText = this.$store.state.translation;
        // 清空 Vuex 中存储的需要翻译的内容
        this.$store.commit('changeTranslation', null);
        // 如果开启了自动翻译就提交翻译
        if (this.$store.state.auto === '识别完成后自动翻译和朗读译文' || this.$store.state.options.autoTranslation) {
          this.submit();
        }
      }
    },
    /**
     * 显示文本框的上下文菜单（右键菜单）
     * @param {MouseEvent} ev 鼠标事件对象
     * @returns {void}
     */
    contextMenu(ev) {
      ev.preventDefault();
      const client = {
        x: ev.clientX,
        y: ev.clientY
      };
      window.electronAPI.ipcRenderer.send('contextMenu', client);
    }
  },
  created() {
    document.title = '翻译 - OCRanslate';
    // 如果是讯飞翻译就更改默认语言选项
    if (this.$store.state.options.translationProvider === 'xunfei') {
      this.languageSelected1 = 'en';
      this.languageSelected2 = 'cn';
    }
    // 如果是有道翻译就更改默认语言选项
    if (this.$store.state.options.translationProvider === 'youdao') {
      this.languageSelected1 = 'auto';
      this.languageSelected2 = 'zh-CHS';
    }

    // 初始化语音
    this.voice = new Voice({
      volume: this.$store.state.options.translationVoiceVolume / 10,
      speed: this.$store.state.options.translationVoiceSpeed
    });

    // 检查 API 密钥
    this.apiInit();
    // 检查自动翻译
    this.autoTranslation();
  },
  watch: {
    // 监听路由参数变化
    $route(to, from) {
      if (to.path === from.path && to.name === from.name) {
        if (to.query !== from.query) {
          // 检查自动翻译
          this.autoTranslation();
        }
      }
    }
  }
}
</script>

<style scoped>
#translation-page {
  height: 100%;
  flex-direction: column;
  display: flex;
}
/*顶部工具栏区域*/
#translation-page .toolbar {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #EEEEEE;
  -webkit-user-select: none;
  user-select: none;
}
/*工具栏的按钮*/
#translation-page .toolbar button {
  transition: 0.3s;
}
#translation-page .toolbar button:focus {
  box-shadow: none;
  color: #409EFF;
}
#translation-page .toolbar button:hover {
  color: #409EFF;
}
/*语言选择区域*/
#translation-page .toolbar .language-box {
  width: 360px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/*输入和译文显示区域*/
#translation-page .text-box {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  flex: 1;
  overflow: hidden;
}
#translation-page .original-box,#translation-page .result-box {
  width: 50%;
  height: 100%;
  display: block;
}
#translation-page .text-box textarea {
  width: 100%;
  height: 100%;
  resize: none;
}
#translation-page .text-box textarea:focus {
  box-shadow: none;
}
</style>