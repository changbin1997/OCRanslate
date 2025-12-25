<template>
  <div id="options-page">
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
    <div class="options-page-box">
      <div class="directory-box p-3">
        <p class="mb-2"><b>快速跳转</b></p>
        <ul class="directory-list" aria-label="快速跳转">
          <li><a href="javascript:;" @click="scrollToSection('#baidu-ocr-title')">百度 OCR 接口</a></li>
          <li><a href="javascript:;" @click="scrollToSection('#tencent-api-title')">腾讯 API 接口</a></li>
          <li><a href="javascript:;" @click="scrollToSection('#xunfei-api-title')">科大讯飞 API 接口</a></li>
          <li><a href="javascript:;" @click="scrollToSection('#youdao-api-title')">有道智云 API 接口</a></li>
          <li><a href="javascript:;" @click="scrollToSection('#ali-api-title')">阿里云 API 接口</a></li>
          <li><a href="javascript:;" @click="scrollToSection('#tesseract-ocr-title')">TesseractOCR（离线识别）</a></li>
          <li><a href="javascript:;" @click="scrollToSection('#baidu-translation-title')">百度翻译接口</a></li>
          <li><a href="javascript:;" @click="scrollToSection('#translation-provider-title')">翻译引擎设置</a></li>
          <li><a href="javascript:;" @click="scrollToSection('#ocr-volume-title')">OCR 语音朗读设置</a></li>
          <li><a href="javascript:;" @click="scrollToSection('#translation-volume-title')">翻译语音朗读设置</a></li>
          <li><a href="javascript:;" @click="scrollToSection('#key-title')">全局快捷键</a></li>
          <li><a href="javascript:;" @click="scrollToSection('#specific-area-title')">指定区域识别</a></li>
          <li><a href="javascript:;" @click="scrollToSection('#automation-title')">自动执行（用于手动选择图片和翻译）</a></li>
          <li><a href="javascript:;" @click="scrollToSection('#clipboard-translation-title')">自动翻译剪贴板的文字</a></li>
        </ul>
      </div>
      <div class="options-box p-3 border-start">
        <!--百度 OCR 接口-->
        <p class="mb-2" id="baidu-ocr-title"><b>百度 OCR 接口</b></p>
        <div aria-label="百度 OCR 接口" role="group">
          <div class="mb-3">
            <label for="baidu-app-id" class="form-label">App ID</label>
            <input type="text" id="baidu-app-id" class="form-control" placeholder="百度 OCR 的 App ID" v-model="optionsSelected.baiduOcrAppID">
          </div>
          <div class="mb-3">
            <label for="baidu-api-key" class="form-label">API Key</label>
            <input type="text" id="baidu-api-key" class="form-control" placeholder="百度 OCR 的 API Key" v-model="optionsSelected.baiduOcrApiKey">
          </div>
          <div class="mb-3">
            <label for="baidu-secret-key" class="form-label">Secret Key</label>
            <input type="text" id="baidu-secret-key" class="form-control" placeholder="百度 OCR 的 Secret Key" v-model="optionsSelected.baiduOcrSecretKey">
          </div>
          <div class="mb-3">
            <label for="baidu-ocr-language-selected" class="form-label">百度 OCR 默认识别的语言</label>
            <select id="baidu-ocr-language-selected" class="form-select" v-model="optionsSelected.baiduOcrLanguageSelected">
              <option v-for="(item, index) of baiduOcrLanguageList" :key="index" v-bind:value="item.code">{{item.name}}</option>
            </select>
          </div>
        </div>
        <div class="mb-4"></div>
        <!--腾讯 OCR 接口-->
        <p class="mb-2" id="tencent-api-title"><b>腾讯 API 接口</b></p>
        <div aria-label="腾讯 API 接口" role="group">
          <div class="mb-3">
            <label for="tencent-app-id" class="form-label">App ID</label>
            <input type="text" id="tencent-app-id" class="form-control" placeholder="腾讯 OCR 的 App ID" v-model="optionsSelected.tencentOcrAppID">
          </div>
          <div class="mb-3">
            <label for="tencent-secret-id" class="form-label">Secret ID</label>
            <input type="text" id="tencent-secret-id" class="form-control" placeholder="腾讯 OCR 的 Secret ID" v-model="optionsSelected.tencentOcrSecretID">
          </div>
          <div class="mb-3">
            <label for="tencent-secret-key" class="form-label">Secret Key</label>
            <input type="text" id="tencent-secret-key" class="form-control" placeholder="腾讯 OCR 的 Secret Key" v-model="optionsSelected.tencentOcrSecretKey">
          </div>
          <div class="mb-3">
            <label for="tencent-ocr-language-selected" class="form-label">腾讯 OCR 默认识别的语言</label>
            <select aria-describedby="tencent-ocr-language-description" id="tencent-ocr-language-selected" class="form-select" v-model="optionsSelected.tencentOcrLanguageSelected">
              <option v-for="(item, index) of tencentOcrLanguageList" :key="index" v-bind:value="item.code">{{item.name}}</option>
            </select>
            <p class="mt-3" id="tencent-ocr-language-description">注意，只有普通的腾讯云通用印刷体识别支持手动设置语言，其它的腾讯识别接口设置语言无效！</p>
          </div>
          <div class="mb-3">
            <label for="tencent-ocr-region-selected" class="form-label">腾讯 OCR 服务器地域</label>
            <select id="tencent-ocr-region-selected" class="form-select" v-model="optionsSelected.tencentOcrRegionSelected">
              <option v-for="(item, index) of tencentOcrRegionList" :key="index" v-bind:value="item.code">{{item.name}}</option>
            </select>
          </div>
        </div>
        <div class="mb-4"></div>
        <!--讯飞 OCR 接口-->
        <p class="mb-2" id="xunfei-api-title"><b>科大讯飞 API 接口</b></p>
        <div aria-label="科大讯飞 API 接口" role="group">
          <div class="mb-3">
            <label for="xunfei-app-id" class="form-label">App ID</label>
            <input type="text" id="xunfei-app-id" class="form-control" placeholder="科大讯飞 OCR 的 App ID" v-model="optionsSelected.xunfeiOcrAPPId">
          </div>
          <div class="mb-3">
            <label for="xunfei-secret" class="form-label">API Secret</label>
            <input type="text" id="xunfei-secret" class="form-control" placeholder="科大讯飞 OCR 的 API Secret" v-model="optionsSelected.xunfeiOcrAPISecret">
          </div>
          <div class="mb-3">
            <label for="xunfei-api-key" class="form-label">API Key</label>
            <input type="text" id="xunfei-api-key" class="form-control" placeholder="科大讯飞 OCR 的 API Key" v-model="optionsSelected.xunfeiOcrAPIKey">
          </div>
        </div>
        <div class="mb-4"></div>
        <!--有道 OCR 接口-->
        <p class="mb-2" id="youdao-api-title"><b>有道智云 API 接口</b></p>
        <div aria-label="有道智云 API 接口" role="group">
          <div class="mb-3">
            <label for="youdao-app-id" class="form-label">App ID</label>
            <input type="text" id="youdao-app-id" class="form-control" placeholder="有道智云 OCR 的 App ID" v-model="optionsSelected.youdaoOcrAppID">
          </div>
          <div class="mb-3">
            <label for="youdao-app-key" class="form-label">App 密钥</label>
            <input type="text" id="youdao-app-key" class="form-control" placeholder="有道智云 OCR 的密钥" v-model="optionsSelected.youdaoOcrAppKey">
          </div>
          <div class="mb-3">
            <label for="youdao-ocr-language-selected" class="form-label">有道 OCR 默认识别的语言</label>
            <select id="youdao-ocr-language-selected" class="form-select" v-model="optionsSelected.youdaoOcrLanguageSelected">
              <option v-for="(item, index) of youdaoOcrLanguageList" :key="index" v-bind:value="item.code">{{item.name}}</option>
            </select>
          </div>
        </div>
        <div class="mb-4"></div>
        <!--阿里云OCR接口-->
        <p class="mb-2" id="ali-api-title"><b>阿里云 API 接口</b></p>
        <div aria-label="阿里云 API 接口" role="group">
          <div class="mb-3">
            <label for="aliyun-accesskey-id" class="form-label">AccessKey ID</label>
            <input type="text" id="aliyun-accesskey-id" class="form-control" placeholder="阿里云的 AccessKey ID" v-model="optionsSelected.aliyunAccessKeyID">
          </div>
          <div class="mb-3">
            <label for="aliyun-accesskey-secret" class="form-label">AccessKey Secret</label>
            <input type="text" id="aliyun-accesskey-secret" class="form-control" placeholder="阿里云的 AccessKey Secret" v-model="optionsSelected.aliyunAccessKeySecret">
          </div>
        </div>
        <div class="mb-4"></div>
        <!--tesseractOCR-->
        <p class="mb-2" id="tesseract-ocr-title"><b>TesseractOCR（离线识别）</b></p>
        <div aria-label="TesseractOCR（离线识别）" role="group">
          <div class="mb-3">
            <label for="tesseract-ocr-language-selected" class="form-label">TesseractOCR 默认识别的语言</label>
            <select aria-describedby="tesseract-ocr-language-description" id="tesseract-ocr-language-selected" class="form-select" v-model="optionsSelected.tesseractOcrLanguageSelected">
              <option v-for="(item, index) of tesseractOcrLanguageList" :key="index" v-bind:value="item.code">{{item.name}}</option>
            </select>
            <p id="tesseract-ocr-language-description" class="mt-3">默认只包含中文和英文的识别模型，其它语言需要下载识别模型，在 <router-link :to="{name: 'tessdataPage'}">Tessdata语言模型文件管理</router-link> 可以查看已下载的语言模型和下载方式。</p>
          </div>
        </div>
        <div class="mb-4"></div>
        <!--百度翻译接口-->
        <p class="mb-2" id="baidu-translation-title"><b>百度翻译接口</b></p>
        <div aria-label="百度翻译接口" role="group">
          <div class="mb-3">
            <label for="baidu-translation-app-id" class="form-label">App ID</label>
            <input type="text" id="baidu-translation-app-id" class="form-control" placeholder="百度翻译的 App ID" v-model="optionsSelected.baiduTranslationAppID">
          </div>
          <div class="mb-3">
            <label for="baidu-translation-api-key" class="form-label">API Key</label>
            <input type="text" id="baidu-translation-api-key" class="form-control" placeholder="百度翻译的 API Key" v-model="optionsSelected.baiduTranslationApiKey">
          </div>
        </div>
        <div class="mb-4"></div>
        <!--翻译引擎设置-->
        <p class="mb-2" id="translation-provider-title"><b>翻译引擎设置</b></p>
        <div aria-label="翻译引擎设置" role="group">
          <div class="mb-3">
            <label for="translation-provider" class="form-label">默认使用的翻译引擎</label>
            <select aria-describedby="translation-provider-description" id="translation-provider" class="form-select" v-model="optionsSelected.translationProvider">
              <option value="baidu">百度翻译</option>
              <option value="tencent">腾讯翻译</option>
              <option value="xunfei">讯飞翻译</option>
              <option value="youdao">有道翻译</option>
              <option value="ali">阿里翻译</option>
            </select>
            <p class="mt-3" id="translation-provider-description">腾讯、讯飞、有道、阿里的 OCR 和翻译使用的是相同的密钥信息，只需要开通功能就可以使用了。</p>
          </div>
        </div>
        <!--OCR语音设置-->
        <p class="mb-2" id="ocr-volume-title"><b>OCR 语音朗读设置</b></p>
        <div aria-label="OCR语音朗读" role="group">
          <div class="mb-3">
            <label for="ocr-volume" class="form-label">语音音量</label>
            <input type="range" class="form-range" id="ocr-volume" max="10" min="1" v-model="optionsSelected.ocrVoiceVolume">
          </div>
          <div class="mb-3">
            <label for="ocr-speed" class="form-label">语音语速</label>
            <input type="range" class="form-range" id="ocr-speed" max="10" min="1" v-model="optionsSelected.ocrVoiceSpeed">
          </div>
          <div class="mb-3">
            <label for="ocr-voice-library" class="form-label">发音人</label>
            <select id="ocr-voice-library" class="form-select" v-model="optionsSelected.ocrVoiceLibrarySelected">
              <option v-for="(item, index) of voiceLibraryList" :key="index" v-bind:value="item.name">{{item.name}} {{item.lang}}</option>
            </select>
          </div>
          <div class="mb-3">
            <button type="button" class="btn btn-outline-primary" @click="voiceTest">测试语音朗读效果</button>
          </div>
        </div>
        <div class="mb-4"></div>
        <!--翻译语音朗读设置-->
        <p class="mb-2" id="translation-volume-title"><b>翻译语音朗读设置</b></p>
        <div aria-label="翻译语音朗读" role="group">
          <div class="mb-3">
            <label for="translation-volume" class="form-label">语音音量</label>
            <input type="range" class="form-range" id="translation-volume" max="10" min="1" v-model="optionsSelected.translationVoiceVolume">
          </div>
          <div class="mb-3">
            <label for="translation-speed" class="form-label">语音语速</label>
            <input type="range" class="form-range" id="translation-speed" max="10" min="1" v-model="optionsSelected.translationVoiceSpeed">
          </div>
          <div class="mb-3">
            <label for="translation-voice-library" class="form-label">发音人</label>
            <select aria-describedby="translation-voice-library-description" id="translation-voice-library" class="form-select" v-model="optionsSelected.translationVoiceLibrarySelected">
              <option value="auto">根据语言自动选择</option>
              <option v-for="(item, index) of voiceLibraryList" :key="index" v-bind:value="item.name">{{item.name}} {{item.lang}}</option>
            </select>
          </div>
          <p class="mt-3" id="translation-voice-library-description">如果您对发音人没有特别需求的话，可以使用根据语言自动选择发音人。</p>
        </div>
        <div class="mb-4"></div>
        <!--快捷键-->
        <p class="mb-2" id="key-title"><b>全局快捷键</b></p>
        <div aria-label="快捷键" role="group">
          <!--快捷键1-->
          <div class="mb-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="key-f1" v-model="optionsSelected.key1Enable">
              <label class="form-check-label" for="key-f1">启用全局快捷键1</label>
            </div>
          </div>
          <div class="mb-3">
            <label for="key1-name" class="form-label">快捷键1要使用的快捷键</label>
            <input aria-describedby="key1-name-description" type="text" id="key1-name" class="form-control" placeholder="在这里按下要使用的快捷键" @keydown="getKeyName($event, 'key1Name')" v-model="optionsSelected.key1Name" readonly :disabled="!optionsSelected.key1Enable">
          </div>
          <p class="mt-3" id="key1-name-description">你可以在上方的表单中按下需要使用的按键来更改快捷键设置</p>
          <div class="mb-3">
            <label for="key-f1-function" class="form-label">快捷键1使用的接口</label>
            <select id="key-f1-function" class="form-select" v-model="optionsSelected.key1Function" :disabled="!optionsSelected.key1Enable">
              <option v-for="(item, index) of hotKeyFunction" :key="index" v-bind:value="item.name">{{item.name}}</option>
            </select>
          </div>
          <div class="mb-3">
            <label for="key1-auto" class="form-label">快捷键1自动操作</label>
            <select id="key1-auto" class="form-select" :disabled="!optionsSelected.key1Enable" v-model="optionsSelected.key1Auto">
              <option value="无">无</option>
              <option value="识别完成后自动朗读识别文字">识别完成后自动朗读识别文字</option>
              <option value="识别完成后自动翻译和朗读译文">识别完成后自动翻译和朗读译文</option>
            </select>
          </div>
          <!--快捷键2-->
          <div class="mb-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="key-f2" v-model="optionsSelected.key2Enable">
              <label class="form-check-label" for="key-f2">启用全局快捷键2</label>
            </div>
          </div>
          <div class="mb-3">
            <label for="key2-name" class="form-label">快捷键2要使用的快捷键</label>
            <input aria-describedby="key2-name-description" type="text" id="key2-name" class="form-control" placeholder="在这里按下要使用的快捷键" @keydown="getKeyName($event, 'key2Name')" v-model="optionsSelected.key2Name" readonly :disabled="!optionsSelected.key2Enable">
          </div>
          <p class="mt-3" id="key2-name-description">你可以在上方的表单中按下需要使用的按键来更改快捷键设置</p>
          <div class="mb-3">
            <label for="key-f2-function" class="form-label">快捷键2使用的接口</label>
            <select id="key-f2-function" class="form-select" v-model="optionsSelected.key2Function" :disabled="!optionsSelected.key2Enable">
              <option v-for="(item, index) of hotKeyFunction" :key="index" v-bind:value="item.name">{{item.name}}</option>
            </select>
          </div>
          <div class="mb-3">
            <label for="key2-auto" class="form-label">快捷键2自动操作</label>
            <select id="key2-auto" class="form-select" :disabled="!optionsSelected.key2Enable" v-model="optionsSelected.key2Auto">
              <option value="无">无</option>
              <option value="识别完成后自动朗读识别文字">识别完成后自动朗读识别文字</option>
              <option value="识别完成后自动翻译和朗读译文">识别完成后自动翻译和朗读译文</option>
            </select>
          </div>
        </div>
        <div class="mb-4"></div>
        <!--指定区域识别-->
        <p class="mb-2" id="specific-area-title"><b>指定区域识别</b></p>
        <div aria-label="指定区域识别" role="group">
          <div class="mb-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="specific-area" v-model="optionsSelected.specificArea">
              <label class="form-check-label" for="specific-area">启用指定区域识别</label>
            </div>
          </div>
          <div class="mb-3">
            <label for="specific-areaKey-name" class="form-label">指定区域识别要使用的快捷键</label>
            <input aria-describedby="specific-areaKey-name-description" type="text" id="specific-areaKey-name" class="form-control" placeholder="在这里按下要使用的快捷键" @keydown="getKeyName($event, 'specificAreaKeyName')" v-model="optionsSelected.specificAreaKeyName" readonly :disabled="!optionsSelected.specificArea">
          </div>
          <p class="mt-3" id="specific-areaKey-name-description">你可以在上方的表单中按下需要使用的按键来更改快捷键设置</p>
          <div class="mb-3">
            <label for="specific-area-left" class="form-label">识别区域左侧起始位置</label>
            <input type="number" id="specific-area-left" class="form-control" placeholder="识别区域左侧起始位置（px）" v-model="optionsSelected.specificAreaLeft" :disabled="!optionsSelected.specificArea">
          </div>
          <div class="mb-3">
            <label for="specific-area-top" class="form-label">识别区域顶部起始位置</label>
            <input type="number" id="specific-area-top" class="form-control" placeholder="识别区域顶部起始位置（px）" v-model="optionsSelected.specificAreaTop" :disabled="!optionsSelected.specificArea">
          </div>
          <div class="mb-3">
            <label for="specific-area-width" class="form-label">识别区域宽度</label>
            <input type="number" id="specific-area-width" class="form-control" placeholder="识别区域宽度（px）" v-model="optionsSelected.specificAreaWidth" :disabled="!optionsSelected.specificArea">
          </div>
          <div class="mb-3">
            <label for="specific-area-height" class="form-label">识别区域高度</label>
            <input type="number" id="specific-area-height" class="form-control" placeholder="识别区域高度（px）" v-model="optionsSelected.specificAreaHeight" :disabled="!optionsSelected.specificArea">
          </div>
          <div class="mb-3">
            <button type="button" class="btn btn-outline-primary me-2" @click="openSelector" :disabled="!optionsSelected.specificArea">使用屏幕区域选择器选择识别区域</button>
            <span>屏幕区域选择器可以通过鼠标框选区域来获取屏幕位置</span>
          </div>
          <div class="mb-3">
            <label for="specific-area-api" class="form-label">指定区域识别使用的接口</label>
            <select id="specific-area-api" class="form-select" v-model="optionsSelected.specificAreaApi" :disabled="!optionsSelected.specificArea">
              <option v-for="(item, index) of hotKeyFunction" :key="index" v-bind:value="item.name">{{item.name}}</option>
            </select>
          </div>
          <div class="mb-3">
            <label for="specific-area-auto" class="form-label">指定区域识别自动操作</label>
            <select id="specific-area-auto" class="form-select" :disabled="!optionsSelected.specificArea" v-model="optionsSelected.specificAreaAuto">
              <option value="无">无</option>
              <option value="识别完成后自动朗读识别文字">识别完成后自动朗读识别文字</option>
              <option value="识别完成后自动翻译和朗读译文">识别完成后自动翻译和朗读译文</option>
            </select>
          </div>
        </div>
        <!--自动执行（用于手动选择图片和翻译）-->
        <p class="mb-2" id="automation-title"><b>自动执行（用于手动选择图片和翻译）</b></p>
        <div aria-label="自动执行" role="group">
          <div class="mb-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="ocr-auto-voice" v-model="optionsSelected.ocrAutoVoice" @change="optionsSelected.autoTranslation = false">
              <label class="form-check-label" for="ocr-auto-voice">OCR识别完成后自动朗读</label>
            </div>
          </div>
          <div class="mb-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="translation-auto-voice" v-model="optionsSelected.translationAutoVoice">
              <label class="form-check-label" for="translation-auto-voice">翻译完成后自动朗读译文内容</label>
            </div>
          </div>
          <div class="mb-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="auto-translation" v-model="optionsSelected.autoTranslation" @change="optionsSelected.ocrAutoVoice = false">
              <label class="form-check-label" for="auto-translation">OCR识别完成后自动翻译</label>
            </div>
          </div>
        </div>
        <div class="mb-4"></div>
        <!--剪贴板翻译-->
        <p class="mb-2" id="clipboard-translation-title"><b>自动翻译剪贴板的文字</b></p>
        <div aria-label="自动翻译剪贴板的文字" role="group">
          <div class="mb-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="clipboard-translation" v-model="optionsSelected.clipboardTranslation">
              <label class="form-check-label" for="clipboard-translation">启用剪贴板翻译</label>
            </div>
          </div>
          <div class="mb-3">
            <label for="clipboard-translation-key-name" class="form-label">翻译剪贴板要使用的快捷键</label>
            <input aria-describedby="clipboard-translation-key-name-description" type="text" id="clipboard-translation-key-name" class="form-control" placeholder="在这里按下要使用的快捷键" @keydown="getKeyName($event, 'clipboardTranslationKeyName')" v-model="optionsSelected.clipboardTranslationKeyName" readonly :disabled="!optionsSelected.clipboardTranslation">
          </div>
          <p class="mt-3" id="clipboard-translation-key-name-description">你可以在上方的表单中按下需要使用的按键来更改快捷键设置</p>
        </div>
        <div class="mb-4"></div>
        <div>
          <button type="button" class="btn btn-primary" @click="saveOptions" :disabled="disabledSaveBtn">保存设置</button>
        </div>
        <div class="mb-4"></div>
        <p><b>小提示：</b></p>
        <ol>
          <li>中文发音人可以朗读中文和英文</li>
          <li>英文发音人只能朗读英文</li>
          <li>OCR 识别完成后自动朗读和自动翻译不能同时开启，开启自动翻译后 OCR 自动朗读会被取消</li>
          <li>Windows10 及以上的系统可以在 设置 - 时间和语言 - 语音 - 已安装的语音包添加语音库</li>
          <li>快捷键不建议使用单独的一个 Ctrl 或 Shift 之类的按键，这些按键是 Windows 的快捷键，设置后可能无法成功绑定。如果需要使用 Ctrl 或 Shift 的话，可以使用 Ctrl + 按键2 之类的组合方式。</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script>
import Voice from './../modules/voice';
import ocrLanguageList from './../modules/ocr-language-list';

export default {
  name: 'options-page',
  data() {
    return {
      optionsSelected: {
        tesseractOcrLanguageSelected: 'chi_sim',
        youdaoOcrAppID: '',
        youdaoOcrAppKey: '',
        youdaoOcrLanguageSelected: 'auto',
        xunfeiOcrAPPId: '',
        xunfeiOcrAPISecret: '',
        xunfeiOcrAPIKey: '',
        baiduOcrAppID: '',
        baiduOcrApiKey : '',
        baiduOcrSecretKey: '',
        baiduOcrLanguageSelected: 'CHN_ENG',
        tencentOcrAppID: '',
        tencentOcrSecretID: '',
        tencentOcrSecretKey: '',
        tencentOcrLanguageSelected: 'zh_rare',
        tencentOcrRegionSelected: 'ap-shanghai',
        aliyunAccessKeyID: '',
        aliyunAccessKeySecret: '',
        baiduTranslationAppID: '',
        baiduTranslationApiKey: '',
        translationProvider: 'baidu',
        ocrVoiceSpeed: 2,
        ocrVoiceVolume: 10,
        ocrVoiceLibrarySelected: '',
        translationVoiceSpeed: 2,
        translationVoiceVolume: 10,
        translationVoiceLibrarySelected: 'auto',
        key1Enable: false,
        key1Name: 'F1',
        key1Function: '百度云通用文字识别（标准版）',
        key1Provider: 'baidu',
        key1Auto: '无',
        key2Enable: false,
        key2Name: 'F2',
        key2Function: '腾讯云通用印刷体识别',
        key2Provider: 'tencent',
        key2Auto: '无',
        specificArea: false,
        specificAreaKeyName: 'F3',
        specificAreaLeft: 0,
        specificAreaTop: 0,
        specificAreaWidth: 300,
        specificAreaHeight: 300,
        specificAreaApi: '腾讯云通用印刷体识别',
        specificAreaProvider: 'tencent',
        specificAreaAuto: '无',
        ocrAutoVoice: false,
        translationAutoVoice: false,
        autoTranslation: false,
        clipboardTranslation: false,
        clipboardTranslationKeyName: 'F4'
      },
      voiceLibraryList: [],
      hotKeyFunction: [
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
        {provider: 'ali', name: '阿里云通用文字识别'},
        {provider: 'ali', name: '阿里云全文识别高精版'},
        {provider: 'tesseract', name: 'TesseractOCR（离线识别）'}
      ],
      synth: null,
      disabledSaveBtn: false,
      baiduOcrLanguageList: ocrLanguageList.baidu,
      tencentOcrLanguageList: ocrLanguageList.tencent,
      youdaoOcrLanguageList: ocrLanguageList.youdao,
      tesseractOcrLanguageList: ocrLanguageList.tesseract,
      tencentOcrRegionList: [
        {code: 'ap-beijing', name: '亚洲-北京'},
        {code: 'ap-shanghai', name: '亚洲-上海'},
        {code: 'ap-guangzhou', name: '亚洲-广州'},
        {code: 'ap-hongkong', name: '亚洲-香港'},
        {code: 'na-toronto', name: '北美-多伦多'}
      ]
    }
  },
  methods: {
    /**
     * 平滑滚动到指定的页面区域标题
     * @param {string} titleId 目标标题的 CSS 选择器 ID（如 '#section-id'）
     * @returns {void}
     */
    scrollToSection(titleId) {
      document.querySelector(titleId).scrollIntoView({
        behavior: 'smooth'
      });
    },
    /**
     * 根据键盘按键事件获取快捷键组合并保存
     * @param {KeyboardEvent} ev 键盘事件对象
     * @param {string} keyIndex 要保存快捷键的数据属性名（如 'key1Name'）
     * @returns {Promise<false>} 总是返回 false 以阻止默认事件
     */
    async getKeyName(ev, keyIndex) {
      if (ev.key !== 'Tab') ev.preventDefault();
      let keysPressed = ev.key;
      // 判断组合键
      if (ev.shiftKey) keysPressed = `Shift+${keysPressed}`;
      if (ev.ctrlKey) keysPressed = `Ctrl+${keysPressed}`;
      if (ev.altKey) keysPressed = `Alt+${keysPressed}`;
      if (ev.metaKey) keysPressed = `Meta+${keysPressed}`;
      this.optionsSelected[keyIndex] = keysPressed;
      return false;
    },
    /**
     * 打开屏幕区域选择器窗口并获取用户选择的区域信息
     * @returns {Promise<void|false>} 选择成功时返回 void，出错时返回 false
     */
    async openSelector() {
      const result = await window.electronAPI.ipcRenderer.invoke('selector-window');
      if (result.result !== 'success') {
        await window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '截取屏幕出错',
            message: result.msg,
            buttons: ['关闭'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }

      this.optionsSelected.specificAreaLeft = result.left;
      this.optionsSelected.specificAreaTop = result.top;
      this.optionsSelected.specificAreaWidth = result.width;
      this.optionsSelected.specificAreaHeight = result.height;
    },
    /**
     * 测试 OCR 语音朗读效果
     * @param {MouseEvent} ev 按钮点击事件对象，用于获取按钮元素
     * @returns {void}
     */
    voiceTest(ev) {
      const text = '你好，很高兴认识你。Hello, Nice to meet you.';  // 语音测试朗读的内容
      // 语音设置配置
      const voiceOptions = {
        volume: this.optionsSelected.ocrVoiceVolume / 10,
        speed: this.optionsSelected.ocrVoiceSpeed,
        voiceLibrary: this.optionsSelected.ocrVoiceLibrarySelected
      };

      const voice = new Voice(voiceOptions);
      // 延迟开始朗读
      setTimeout(() => {
        // 开始朗读
        voice.start({
          text: text,
          // 朗读开始
          start: () => {
            ev.target.disabled = true;
          },
          // 朗读停止
          stop: () => {
            ev.target.disabled = false;
          }
        });
      }, 300);
    },
    /**
     * 加载系统可用的语音库列表，如未设置则选择中文语音库为默认
     * @returns {void}
     */
    loadVoiceLibraryList() {
      this.synth = window.speechSynthesis;
      // 延迟获取语音库
      setTimeout(() => {
        // 获取语音库
        this.voiceLibraryList = this.synth.getVoices();
        // 如果已经设置了语音库就返回，否则就找出一个中文语音库作为默认选中的语音库
        if (this.optionsSelected.ocrVoiceLibrarySelected !== '') return false;
        // 找出一个中文语音库作为默认选中的语音库
        const voiceLibrary = this.voiceLibraryList.find(item => item.lang === 'zh-CN');
        if (voiceLibrary !== undefined && voiceLibrary !== null) this.optionsSelected.ocrVoiceLibrarySelected = voiceLibrary;
      }, 30);
    },
    /**
     * 保存设置选项到数据库，检查快捷键冲突，并在保存成功后询问是否重启程序
     * @returns {Promise<void|false>} 快捷键冲突或保存失败时返回 false，否则返回 void
     */
    async saveOptions() {
      // 检查快捷键是否有重复
      const keyName = [this.optionsSelected.key1Name, this.optionsSelected.key2Name, this.optionsSelected.specificAreaKeyName];
      if (new Set(keyName).size !== keyName.length) {
        await window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '快捷键冲突',
            message: '同一个快捷键不能使用多次，请检查快捷键设置！',
            buttons: ['关闭'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }
      // 要保存的数据
      const submitData = this.optionsSelected;
      // 设置全局快捷键调用的提供商
      submitData.key1Provider = this.hotKeyFunction.find(item => item.name === this.optionsSelected.key1Function).provider;
      submitData.key2Provider = this.hotKeyFunction.find(item => item.name === this.optionsSelected.key2Function).provider;
      // 设置指定区域识别调用的提供商
      submitData.specificAreaProvider = this.hotKeyFunction.find(item => item.name === this.optionsSelected.specificAreaApi).provider;
      // 更新 Vuex 存储的选项
      this.$store.commit('changeOptions', submitData);
      // 禁用保存按钮
      this.disabledSaveBtn = true;
      // 发送保存请求
      const result = await window.electronAPI.ipcRenderer.invoke('updateOptions', submitData);
      // 恢复保存按钮
      this.disabledSaveBtn = false;
      // 保存出错
      if (result.result !== 'success') {
        await window.electronAPI.ipcRenderer.invoke('dialog', {
          name: 'showMessageBox',
          options: {
            title: '更新数据出错',
            message: result.msg,
            buttons: ['关闭'],
            type: 'error',
            noLink: true
          }
        });
        return false;
      }
      const restart = await window.electronAPI.ipcRenderer.invoke('dialog', {
        name: 'showMessageBox',
        options: {
          title: '已成功保存',
          message: `有 ${result.count} 个选项已成功保存，快捷键相关的设置需要重启程序才会生效，您需要现在重启程序吗？`,
          buttons: ['确认重启', '取消'],
          type: 'info',
          noLink: true
        }
      });
      // 重启程序
      if (restart.response === 0) {
        await window.electronAPI.ipcRenderer.invoke('restart');
      }
    }
  },
  created() {
    document.title = '常用设置 - OCRanslate';
    // 获取选项
    this.optionsSelected = this.$store.state.options;
    // 加载语音库
    this.loadVoiceLibraryList();
  }
}
</script>

<style scoped>
/*顶部的标签页区域*/
#options-page .tabs-box {
  position: fixed;
  z-index: 100;
  background: #FFFFFF;
  width: 100%;
}

#options-page {
  height: 100%;
  overflow: auto;
}
#options-page .options-page-box {
  display: flex;
  justify-content: flex-start;
  padding-top: 42px;
}

/*目录区域*/
#options-page .directory-box {
  width: 230px;
  position: absolute;
}
#options-page .directory-list {
  padding-left: 0;
  list-style: none;
}
#options-page .directory-list li {
  margin-bottom: 4px;
}
#options-page .directory-list a {
  color: #2780E3;
  text-decoration: none;
}

/*设置区域*/
#options-page .options-box {
  height: 100%;
  margin-left: 230px;
  overflow-y: auto;
}
#options-page p,#options-page label {
  -webkit-user-select: none;
  user-select: none;
}
</style>