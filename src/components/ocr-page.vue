<template>
  <div id="ocr-page">
    <div role="toolbar" class="toolbar px-1">
      <div class="btn-group btn-box">
        <button type="button" title="清除图片和识别结果" class="btn" @click="clear" :disabled="ocrText < 1">
          <i class="icon-cross me-1"></i>
          <span>清空</span>
        </button>
        <button type="button" title="朗读识别结果" class="btn" :disabled="ocrText < 1 || disabledVoiceBtn" @click="startVoice">
          <i class="icon-volume-medium me-1"></i>
          <span>朗读</span>
        </button>
        <button type="button" title="拷贝识别结果" class="btn" :disabled="ocrText < 1" @click="copyText">
          <i class="icon-copy me-1"></i>
          <span>拷贝</span>
        </button>
        <button type="button" title="把识别结果翻译为其它语言" class="btn" :disabled="ocrText < 1" @click="toTranslationPage">
          <i class="icon-earth me-1"></i>
          <span>翻译</span>
        </button>
        <button type="button" title="把识别结果导出为 TXT 或 HTML" class="btn" id="export-btn" @click="exportMenu" :disabled="ocrText < 1">
          <i class="icon-share me-1"></i>
          <span>导出</span>
        </button>
      </div>
      <div class="ocr-type-select">
        <label for="ocr-type-select" class="form-label me-2 mb-0">识别接口</label>
        <div>
          <select v-model="ocrTypeSelectde" class="form-select-sm form-select" id="ocr-type-select" aria-label="识别接口">
            <option v-for="(item, index) of ocrType" :key="index" v-bind:value="item.name">{{item.name}}</option>
          </select>
        </div>
      </div>
    </div>
    <div class="ocr-box">
      <!--文件选择和图片显示区域-->
      <div class="ocr-img-box border-end" @click="showFileDialog" @dragover="preventDefault" @drop="dragFile">
        <img v-bind:src="imgOptions.url" alt="用于识别的图片" v-if="imgOptions.show">
        <div class="guide text-center" v-if="showGuide">
          <h2>点击此处选择图片识别</h2>
          <p>也可以使用快捷键选择屏幕区域识别</p>
        </div>
      </div>
      <div class="ocr-text-box">
        <textarea class="form-control border border-0" v-model="ocrText" aria-label="OCR识别结果" placeholder="此处会显示 OCR 识别结果" @contextmenu="contextMenu" aria-live="assertive"></textarea>
      </div>
    </div>
  </div>
</template>

<script>
import Voice from './../modules/voice';

export default {
  name: 'ocr-page',
  data() {
    return {
      ocrType: [
        {provider: 'baidu', name: '百度云通用文字识别（标准版）'},
        {provider: 'baidu', name: '百度云通用文字识别（高精度版）'},
        {provider: 'tencent', name: '腾讯云通用印刷体识别'},
        {provider: 'tencent', name: '腾讯云通用印刷体识别（高精度版）'},
        {provider: 'tencent', name: '腾讯云通用手写体识别'},
        {provider: 'tencent', name: '腾讯云广告文字识别'},
        {provider: 'tencent', name: '腾讯云通用印刷体识别（精简版）'},
        {provider: 'tencent', name: '腾讯云通用印刷体识别（高速版）'},
        {provider: 'xunfei', name: '科大讯飞通用文字识别'},
        {provider: 'youdao', name: '有道智云通用文字识别'},
        {provider: 'tesseract', name: 'TesseractOCR（离线识别）'}
      ],
      ocrTypeSelectde: '百度云通用文字识别（标准版）',
      showGuide: true,
      imgOptions: {show: false, url: ''},
      ocrText: '',
      voice: null,
      disabledVoiceBtn: false,
      available: {baidu: false, tencent: false, detect: false, xunfei: false, youdao: false, tesseract: true}
    }
  },
  methods: {
    // 显示导出菜单
    exportMenu() {
      if (this.ocrText === '' || this.imgOptions.url === '') return false;

      const ocrResult = {text: this.ocrText, img: this.imgOptions.url};

      // 获取菜单弹出的位置
      const rect = document.querySelector('#export-btn').getBoundingClientRect();
      window.electronAPI.ipcRenderer.send('exportOcrMenu', {
        x: rect.left,
        y: rect.top + rect.height,
        result: ocrResult
      });
    },
    // 显示文件对话框
    showFileDialog() {
      // 清空内容
      if (!this.showGuide) this.clear();
      // 检查 API 是否可用
      if (!this.apiAvailable()) return false;
      // 请求显示文件对话框
      window.electronAPI.ipcRenderer.invoke('dialog', {
        name: 'showOpenDialog',
        options: {
          title: '图片文件选择',
          properties: ['openFile'],
          filters: [
            {name: '图片（image）', extensions: ['jpg', 'jpeg', 'png']}
          ]
        }
      }).then(result => {
        // 如果选择了文件
        if (result.filePaths.length) {
          this.submit(result.filePaths[0]);
        }
      })
    },
    // 处理文件拖拽
    dragFile(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      // 清空内容
      if (!this.showGuide) this.clear();
      // 检查 API 是否可用
      if (!this.apiAvailable()) return false;
      this.submit(ev.dataTransfer.files[0].path);
    },
    // 阻止拖拽的默认事件
    preventDefault(ev) {
      ev.preventDefault();
      ev.stopPropagation();
    },
    // 提交
    async submit(fileName) {
      // 清除 vuex 存储的自动执行
      this.$store.commit('changeAuto', '');
      // 是否是图片
      const isImage = await window.electronAPI.ipcRenderer.invoke('isImage', fileName);
      // 如果不是图片就返回
      if (!isImage) {
        await window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '不支持的图片文件！',
            message: '您选择的图片文件暂不支持，目前只支持 jpg、jpeg、png 的图片！',
            buttons: ['知道了'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }
      // 显示图片
      this.showGuide = false;
      this.imgOptions.url = fileName;
      this.imgOptions.show = true;
      let base64 = fileName;
      // 如果不是 tesseractOCR
      if (this.ocrTypeSelectde !== 'TesseractOCR（离线识别）') {
        // 把图片转为 base64
        base64 = await window.electronAPI.ipcRenderer.invoke('fileToBase64', fileName);
      }
      // 获取图片后缀
      let imgType = fileName.match(/\.([^.]+)$/);
      imgType = imgType ? imgType[1] : 'png';
      // 要提交的数据
      const submitData = {
        type: this.ocrTypeSelectde,
        base64File: base64,
        options: this.$store.state.options,
        imgType: imgType.replace('.', '')
      };
      // 获取 OCR 提供商
      this.ocrType.forEach(item => {
        if (item.name === this.ocrTypeSelectde) submitData.provider = item.provider;
      });
      // 提交
      const result = await window.electronAPI.ipcRenderer.invoke('ocr', submitData);
      // 出错
      if (result.result !== 'success') {
        await window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: 'OCR识别错误',
            message: result.msg,
            buttons: ['关闭'],
            type: 'error',
            noLink: true
          }
        });
        // 清除图片
        this.clear();
        return false;
      }
      // 把识别结果数组用换行符分隔转换为字符串
      this.ocrText = result.list.join("\n");
      // 如果开启了自动朗读就朗读 OCR 文字
      if (this.$store.state.options.ocrAutoVoice) {
        this.startVoice();
      }else if (this.$store.state.options.autoTranslation) {
        // 如果开启了自动翻译就转到翻译页
        this.toTranslationPage();
      }
    },
    // 清除识别结果
    clear() {
      this.ocrText = '';
      this.imgOptions.url = '';
      this.imgOptions.show = false;
      this.showGuide = true;
      this.voice.stop();
      this.$store.commit('changeAuto', '');
    },
    // 拷贝识别结果
    copyText() {
      if (this.ocrText === '') return false;
      // 发送拷贝请求
      window.electronAPI.ipcRenderer.invoke('copy-text', this.ocrText);
    },
    // 转到翻译
    toTranslationPage() {
      if (this.ocrText === '') return false;
      // 把需要翻译的内容放到 Vuex
      this.$store.commit('changeTranslation', this.ocrText);
      // 转到翻译页
      this.$router.push({
        name: 'translationPage',
        query: {ocrTranslation: this.ocrText.length}
      });
    },
    // 开始语音朗读
    startVoice() {
      if (this.ocrText === '') return false;
      this.voice.start({
        text: this.ocrText,
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
    // 初始化语音朗读
    voiceInit() {
      // 初始化语音朗读
      const config = {
        volume: this.$store.state.options.ocrVoiceVolume / 10,
        speed: this.$store.state.options.ocrVoiceSpeed
      }
      if (this.$store.state.options.ocrVoiceLibrarySelected !== '') {
        config.voiceLibrary = this.$store.state.options.ocrVoiceLibrarySelected;
      }
      this.voice = new Voice(config);
    },
    // 检查是否填写了 API 密钥
    apiInit() {
      // 检查百度 OCR API 密钥是否填写
      if (
          this.$store.state.options.baiduOcrAppID !== '' &&
          this.$store.state.options.baiduOcrApiKey !== '' &&
          this.$store.state.options.baiduOcrSecretKey !== ''
      ) {
        this.available.baidu = true;
      }
      // 检查腾讯 OCR 密钥是否填写
      if (
          this.$store.state.options.tencentOcrAppID !== '' &&
          this.$store.state.options.tencentOcrSecretID !== '' &&
          this.$store.state.options.tencentOcrSecretKey !== ''
      ) {
        this.available.tencent = true;
      }
      // 检查讯飞 OCR 密钥是否填写
      if (
          this.$store.state.options.xunfeiOcrAPPId !== "" &&
          this.$store.state.options.xunfeiOcrAPISecret !== '' &&
          this.$store.state.options.xunfeiOcrAPIKey !== ''
      ) {
        this.available.xunfei = true;
      }
      // 检查有道智云 OCR 密钥是否填写
      if (
          this.$store.state.options.youdaoOcrAppID !== '' &&
          this.$store.state.options.youdaoOcrAppKey !== ''
      ) {
        this.available.youdao = true;
      }
      // 把检测状态设置为 true
      this.available.detect = true;
      // 如果没有填写任何 API 信息就弹出提示
      if (!this.available.baidu && !this.available.tencent && !this.available.xunfei && !this.available.youdao) {
        // 是否已经显示过 API 提示
        const ocrApiMessage = localStorage.getItem('ocr_api_message');
        if (ocrApiMessage === '已提示') return true;
        window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '没有填写 API 密钥',
            message: '您还没有填写任何 OCR API 的密钥信息，目前只能使用 TesseractOCR（离线识别），如果要使用在线识别，请在设置中填写需要使用的 OCR 服务密钥信息！',
            buttons: ['知道了'],
            type: 'info',
            noLink: true
          }
        });
        localStorage.setItem('ocr_api_message', '已提示');
      }
    },
    // 检查当前使用的 API 是否填写密钥信息
    apiAvailable() {
      const providerName = {baidu: '百度', tencent: '腾讯', xunfei: '讯飞', youdao: '有道', tesseract: 'Tesseract'};
      let status = true;
      // 获取 OCR 提供商
      for (let i = 0;i < this.ocrType.length;i ++) {
        if (this.ocrType[i].name === this.ocrTypeSelectde && !this.available[this.ocrType[i].provider]) {
          window.electronAPI.ipcRenderer.invoke('dialog', {
            name: 'showMessageBox',
            options: {
              title: `没有填写${providerName[this.ocrType[i].provider]} API 密钥`,
              message: `您还没有填写${providerName[this.ocrType[i].provider]} API 密钥信息，${this.ocrTypeSelectde} 目前暂不可用！`,
              buttons: ['知道了'],
              type: 'info',
              noLink: true
            }
          });
          status = false;
          break;
        }
      }
      return status;
    },
    // 显示 OCR 识别结果（快捷键调用）
    showOcrResult() {
      // 如果 Vuex 中没有数据就直接返回
      if (this.$store.state.ocrResult === null) return false;
      this.showGuide = false;
      // 显示图片
      this.imgOptions.url = 'data:image/png;base64,' + this.$store.state.ocrResult.img;
      this.imgOptions.show = true;
      // 显示文字
      this.ocrText = this.$store.state.ocrResult.list.join("\n");
      // 清空 Vuex 中存储的 OCR 结果
      this.$store.commit('changeOcrResult', null);
      // 自动执行
      if (this.$store.state.auto === '识别完成后自动朗读识别文字') {
        this.startVoice();
        return false;
      }
      if (this.$store.state.auto === '识别完成后自动翻译和朗读译文') this.toTranslationPage();
    },
    // 上下文菜单
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
    document.title = 'OCR文字识别 - OCRanslate';
    // 如果 Vuex 已经获取选项数据就初始化语音
    if (this.$store.state.options !== null) {
      // 初始化语音
      this.voiceInit();
      // 检查 API 密钥
      this.apiInit();
    }
    // 如果路由参数中包含 OCR 结果就显示 OCR 结果
    if (this.$route.query.ocrResult !== undefined && this.$route.query.time !== undefined) {
      this.showOcrResult();
    }
  },
  watch: {
    // 等 App 获取选项数据并传到 Vuex 才会执行
    '$store.state.options': {
      handler() {
        // 如果还没有初始化语音就初始化语音
        if (this.voice === null) this.voiceInit();
        // 如果还没有检查 API 密钥就检查 API 密钥
        if (!this.available.detect) this.apiInit();
      }
    },
    // 监听路由变化
    $route() {
      // 如果路由参数中包含 OCR 结果就显示 OCR 结果
      if (this.$route.query.ocrResult !== undefined && this.$route.query.time !== undefined) {
        this.showOcrResult();
      }
    }
  }
}
</script>

<style scoped>
#ocr-page {
  height: 100%;
  flex-direction: column;
  display: flex;
}
/*工具栏区域*/
#ocr-page .toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #EEEEEE;
  -webkit-user-select: none;
  user-select: none;
}
/*工具栏的按钮*/
#ocr-page .toolbar button {
  transition: 0.3s;
}
#ocr-page .toolbar button:focus {
  box-shadow: none;
  color: #409EFF;
}
#ocr-page .toolbar button:hover {
  color: #409EFF;
}
/*工具栏的识别类型选择区域*/
.toolbar .ocr-type-select {
  width: 320px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.toolbar .ocr-type-select label {
  display: flex;
  flex: none;
}

/*图片和 OCR 结果显示区域*/
.ocr-box {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  flex: 1;
  overflow: hidden;
}
.ocr-img-box,.ocr-text-box {
  width: 50%;
  height: 100%;
  display: block;
}
/*图片显示区域*/
.ocr-img-box {
  position: relative;
  -webkit-user-select: none;
  user-select: none;
}
/*上传指引*/
.ocr-img-box .guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
}
/*图片*/
.ocr-img-box img {
  max-width: 94%;
  max-height: 94%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
/*OCR结果显示区域*/
.ocr-text-box textarea {
  resize: none;
  height: 100%;
}
.ocr-text-box textarea:focus {
  box-shadow: none;
}
</style>