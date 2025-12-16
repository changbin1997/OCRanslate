<template>
  <div id="about-page">
    <div class="p-3">
      <h2>关于本软件</h2>
      <p>这只是我为了个人需求写的一个我自用的软件，目前支持 TesseractOCR（离线识别）和调用在线的 OCR 和翻译 API，下面是支持的在线 API：</p>
      <ul>
        <li>百度通用文字识别 - 通用文字识别（标准版）</li>
        <li>百度通用文字识别 - 通用文字识别（高精度版）</li>
        <li>腾讯通用文字识别 - 通用印刷体识别（标准版）</li>
        <li>腾讯通用文字识别 - 通用印刷体识别（高精度版）</li>
        <li>腾讯通用文字识别 - 广告文字识别</li>
        <li>腾讯通用文字识别 - 手写体识别</li>
        <li>腾讯文字识别API2022 - 通用印刷体识别（精简版）</li>
        <li>腾讯文字识别API2022 - 通用印刷体识别（高速版）</li>
        <li>科大讯飞 - 通用文字识别</li>
        <li>有道智云 - 通用文字识别</li>
        <li>百度翻译 - 通用文本翻译</li>
        <li>腾讯机器翻译 - 文本翻译</li>
        <li>讯飞机器翻译 - 机器翻译</li>
        <li>有道翻译 - 文字翻译</li>
      </ul>
      <p>上面是目前支持调用的 API 服务，如果后续找到还可以的提供免费额度的 API 服务，我也会加进去。</p>
      <p>本软件由 changbin1997 开发，使用 MIT License 开源。</p>
      <p>Github：<a href="https://github.com/changbin1997/ocr-desktop" @click="openLink">https://github.com/changbin1997/ocr-desktop</a></p>
      <p>开发者 Github：<a href="https://github.com/changbin1997" @click="openLink">https://github.com/changbin1997</a></p>
      <p>开发者博客：<a href="https://www.misterma.com" @click="openLink">https://www.misterma.com/</a></p>
      <p>开发者邮箱地址：email@misterma.com</p>
      <h2>API 申请地址 </h2>
      <p>百度 OCR：<a href="https://ai.baidu.com/tech/ocr" @click="openLink">https://ai.baidu.com/tech/ocr</a></p>
      <p>腾讯 OCR：<a href="https://cloud.tencent.com/product/ocr-catalog" @click="openLink">https://cloud.tencent.com/product/ocr-catalog</a></p>
      <p>科大讯飞 OCR：<a href="https://www.xfyun.cn/services/common-ocr" @click="openLink">https://www.xfyun.cn/services/common-ocr</a></p>
      <p>有道智云 OCR：<a href="https://ai.youdao.com/product-ocr-print.s" @click="openLink">https://ai.youdao.com/product-ocr-print.s</a></p>
      <p>百度翻译：<a href="https://fanyi-api.baidu.com/" @click="openLink">https://fanyi-api.baidu.com/</a></p>
      <p>腾讯机器翻译：<a href="https://cloud.tencent.com/product/tmt" @click="openLink">https://cloud.tencent.com/product/tmt</a></p>
      <p>讯飞翻译：<a href="https://www.xfyun.cn/services/xftrans" @click="openLink">https://www.xfyun.cn/services/xftrans</a></p>
      <p>有道翻译：<a href="https://ai.youdao.com/product-fanyi-text.s" @click="openLink">https://ai.youdao.com/product-fanyi-text.s</a></p>
      <p>下面是在线 API 的免费额度说明：</p>
      <ul>
        <li>百度通用文字识别：每月 1000 次免费</li>
        <li>腾讯通用文字识别：每月 1000 次免费</li>
        <li>讯飞通用文字识别：注册后免费 10 万次</li>
        <li>百度翻译 - 通用文本翻译：每月 50000 - 1000000 字免费</li>
        <li>腾讯机器翻译 - 文本翻译：每月 5000000 字免费</li>
        <li>讯飞机器翻译 - 机器翻译：注册后免费 200万字符，有效期一年</li>
      </ul>
      <p>以上信息写于 2022 年 8 月 28 日，API 额度可能随时会更改，一切以官网为准。</p>
      <p>注意，腾讯翻译不是所有的语言都能实现互译！<a href="https://cloud.tencent.com/document/product/551/15619" @click="openLink">点击查看哪些语言可以翻译为哪些语言</a></p>
      <h2>TesseractOCR</h2>
      <p>Tesseract 是 Google 开源的一个 OCR 识别模型，中文的识别准确率可能不如国内互联网公司提供的在线 OCR 服务，但是支持很多种语言。</p>
      <p>TesseractOCR 是离线识别，没有次数限制，也不会加入历史记录。</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'about-page',
  methods: {
    /**
     * 通过浏览器打开链接
     * @param {Event} ev 事件对象
     */
    openLink(ev) {
      ev.preventDefault();
      const url = ev.target.href;
      window.electronAPI.ipcRenderer.send('openLink', url);
    }
  },
  created() {
    document.title = '关于 - OCRanslate';
  }
}
</script>

<style scoped>
#about-page {
  height: 100%;
  overflow-y: auto;
}
#about-page h2 {
  font-size: 22px;
}
</style>