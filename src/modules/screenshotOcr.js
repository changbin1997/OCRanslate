const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const {clipboard} = require('electron');
const Ocr = require('./Ocr');

module.exports = class ScreenshotOcr {
  options = null;  // 选项
  available = {baidu: false, tencent: false, xunfei: false, youdao: false};  // 功能可用性
  providerList = {baidu: '百度', tencent: '腾讯', xunfei: '讯飞', youdao: '有道'};  // OCR 提供商名称

  constructor(options) {
    this.options = options;
    // 检查 百度 OCR API 是否可用
    if (
      this.options.baiduOcrAppID !== '' &&
      this.options.baiduOcrApiKey !== '' &&
      this.options.baiduOcrSecretKey !== ''
    ) {
      this.available.baidu = true;
    }
    // 检查腾讯 OCR API 是否可用
    if (
      this.options.tencentOcrAppID !== '' &&
      this.options.tencentOcrSecretID !== '' &&
      this.options.tencentOcrSecretKey !== ''
    ) {
      this.available.tencent = true;
    }
    // 检查讯飞 OCR API 是否可用
    if (
      this.options.xunfeiOcrAPPId !== '' &&
      this.options.xunfeiOcrAPISecret !== '' &&
      this.options.xunfeiOcrAPIKey !== ''
    ) {
      this.available.xunfei = true;
    }
    // 检查有道 OCR API 是否可用
    if (this.options.youdaoOcrAppID !== '' && this.options.youdaoOcrAppKey !== '') {
      this.available.youdao = true;
    }
  }

  // 识别
  async ocr(provider, ocrType) {
    // 检查接口是否可用
    if (!this.available[provider]) {
      return {code: 0, msg: `缺少 ${this.providerList[provider]} API 密钥！`};
    }
    // 调用截图
    const img = await this.screenshot();
    // 取消截图
    if (img === null) return null;
    // 截图出错
    if (img.code !== undefined && img.msg !== undefined) return img;
    // 调用 OCR 识别
    const ocr = new Ocr(this.options);
    const result = await ocr[provider](ocrType, img);
    // 识别出错
    if (result.code !== undefined && result.msg !== undefined) return result;
    return {img: img, text: result};
  }

  // 截图
  screenshot() {
    return new Promise(resolve => {
      // 截图 dll 位置
      const screenshotModule = {
        dll: path.join(process.cwd(), 'dll', 'PrScrn.dll'),
        exe: path.join(process.cwd(), 'dll', 'PrintScr.exe')
      };
      // 检测截图 exe 是否存在
      fs.exists(screenshotModule.exe, exists => {
        // 如果截图 exe 不存在就直接返回
        if (!exists) {
          resolve({code: 0, msg: `找不到 ${screenshotModule.exe} 文件`});
          return false;
        }
        // 检测截图 dll 是否存在
        fs.exists(screenshotModule.dll, dllExists => {
          if (!dllExists) {
            resolve({code: 0, msg: `找不到 ${screenshotModule.dll} 文件`});
            return false;
          }
          // 打开截图程序
          const screenWindow = child_process.execFile(screenshotModule.exe);
          // 截图程序被关闭
          screenWindow.on('exit', code => {
            // 是否成功截图
            if (code) {
              // 从剪贴板读取图片
              let img = clipboard.readImage();
              // 把图片转为 base64
              img = img.toPNG().toString('base64');
              resolve(img);
            }else {
              resolve(null);
            }
          });
        });
      });
    });
  }
};