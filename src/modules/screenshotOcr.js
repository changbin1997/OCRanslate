const Ocr = require('./Ocr');
const screenshotDesktop = require('screenshot-desktop');
const jimp = require('jimp');
const selectorWindow = require('./selector-window');

module.exports = class ScreenshotOcr {
  options = null; // 选项
  // 功能可用性
  available = {
    baidu: false,
    tencent: false,
    xunfei: false,
    youdao: false,
    ali: false,
    tesseract: true
  };
  // OCR 提供商名称
  providerList = {
    baidu: '百度',
    tencent: '腾讯',
    xunfei: '讯飞',
    youdao: '有道',
    ali: '阿里',
    tesseract: 'Tesseract'
  };

  /**
   * 初始化截图 OCR 模块
   * @param {Object} options 配置对象，包含各 OCR 服务的 API 密钥
   */
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
    if (
      this.options.youdaoOcrAppID !== '' &&
      this.options.youdaoOcrAppKey !== ''
    ) {
      this.available.youdao = true;
    }
    // 检查阿里 OCR API 是否可用
    if (
      this.options.aliyunAccessKeyID !== '' &&
      this.options.aliyunAccessKeySecret !== ''
    ) {
      this.available.ali = true;
    }
  }

  /**
   * 对指定区域的屏幕进行截图并识别
   * @param {string} provider OCR 服务提供商名称
   * @param {string} ocrType OCR 识别类型
   * @param {number} left 截取区域左上角 X 坐标
   * @param {number} top 截取区域左上角 Y 坐标
   * @param {number} width 截取区域宽度
   * @param {number} height 截取区域高度
   * @returns {Promise<Object>} 返回识别结果 {result, msg/text, img}
   */
  async specificArea(provider, ocrType, left, top, width, height) {
    // 检查接口是否可用
    if (!this.available[provider]) {
      return {
        result: 'error',
        msg: `缺少 ${this.providerList[provider]} API 密钥！`
      };
    }
    // 截图和裁剪图片
    let img = null;
    try {
      // 截图
      img = await screenshotDesktop();
      // 裁剪图片
      img = await jimp.read(img);
      img = await img.crop(left, top, width, height);
      img = await img.getBufferAsync(jimp.MIME_JPEG);
      img = img.toString('base64');
    } catch (error) {
      return { result: 'error', msg: error.message };
    }
    // 调用 OCR 识别
    const ocr = new Ocr(this.options);
    let result = null;
    if (provider === 'tesseract') {
      // tesseractOCR
      result = await ocr.tesseract(`data:image/png;base64,${img}`);
    } else {
      // 其它 OCR
      result = await ocr[provider](ocrType, img);
    }
    // 识别出错
    if (result.result !== 'success') return result;
    result.img = img;
    return result;
  }

  /**
   * 截图并进行 OCR 识别
   * @param {string} provider OCR 服务提供商名称
   * @param {string} ocrType OCR 识别类型
   * @returns {Promise<Object|null>} 返回识别结果 {result, msg/text, img} 或 null（用户取消）
   */
  async ocr(provider, ocrType) {
    // 检查接口是否可用
    if (!this.available[provider]) {
      return {
        result: 'error',
        msg: `缺少 ${this.providerList[provider]} API 密钥！`
      };
    }
    // 截图
    const img = await this.screenshot();
    // 是否取消截图
    if (img === null) return null;
    // 截图出错
    if (img.result !== undefined && img.result === 'error') return img;
    // 调用 OCR 识别
    const ocr = new Ocr(this.options);
    let result = null;
    // tesseractOCR
    if (provider === 'tesseract') {
      result = await ocr.tesseract(`data:image/png;base64,${img}`);
    } else {
      result = await ocr[provider](ocrType, img);
    }
    // 识别出错
    if (result.result !== 'success') return result;
    result.img = img;
    return result;
  }

  /**
   * 使用 electron 截图和裁剪图片
   * @returns {Promise<*|boolean>} 返回图片 base64
   */
  async screenshot() {
    // 显示图片区域选择窗口
    const result = await selectorWindow(true);
    // 是否选择了取消
    if (result === null) return null;
    // 是否出错
    if (result.result !== 'success') return result;
    return result.img.replace('data:image/png;base64,', '');
  }
};