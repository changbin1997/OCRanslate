<template>
  <div id="tessdata-page">
    <div class="tabs-box">
      <ul class="nav nav-tabs">
        <li class="nav-item">
          <router-link class="nav-link" :to="{name: 'optionsPage'}" v-bind:class="{'active': $route.name === 'optionsPage'}">常用设置</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" :to="{name: 'tessdataPage'}" v-bind:class="{'active': $route.name === 'tessdataPage'}">Tesseract语言模型文件管理</router-link>
        </li>
      </ul>
    </div>
    <div class="table-box p-3">
      <h2 class="py-3 text-center">已下载 {{downloadCount}} 个语言模型文件</h2>
      <table class="table table-bordered table-striped table-hover">
        <thead>
          <tr>
            <th>语言</th>
            <th>文件</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) of fileList" :key="index">
            <td>{{item.name}}</td>
            <td>{{item.file}}</td>
            <td>{{item.exists}}</td>
          </tr>
        </tbody>
      </table>
      <p>下载更多语言模型可以点击下面两个链接</p>
      <ul>
        <li>
          <a href="https://github.com/tesseract-ocr/tessdata_fast" @click="openLink">极速版模型</a>
        </li>
        <li>
          <a href="https://github.com/tesseract-ocr/tessdata_best" @click="openLink">高精度版模型</a>
        </li>
      </ul>
      <p>极速版的识别速度较快，但准确率可能不如高精度版，高精度版的准确率更高，但识别速度也会更慢。</p>
      <p>下载完成后把 <b>.traineddata</b> 的模型文件放到软件目录下的 <b>tessdata</b> 目录。</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'tessdata-page',
  data() {
    return {
      downloadCount: 0,
      fileList: []
    }
  },
  methods: {
    // 通过浏览器打开链接
    openLink(ev) {
      ev.preventDefault();
      const url = ev.target.href;
      window.electronAPI.ipcRenderer.send('openLink', url);
    },
    // 获取文件列表
    async getFileList() {
      const result = await window.electronAPI.ipcRenderer.invoke('getTesseractOcrFileList', '');
      this.downloadCount = result.count;
      this.fileList = result.list;
    }
  },
  created() {
    document.title = 'Tesseract语言模型文件管理 - OCRanslate';
    // 获取文件列表
    this.getFileList();
  }
}
</script>

<style scoped>
#tessdata-page .tabs-box {
  position: fixed;
  z-index: 100;
  background: #FFFFFF;
  width: 100%;
}

#tessdata-page {
  height: 100%;
  overflow-y: auto;
}
#tessdata-page .table-box {
  margin-top: 42px;
}
#tessdata-page * {
  -webkit-user-select: none;
  user-select: none;
}
</style>