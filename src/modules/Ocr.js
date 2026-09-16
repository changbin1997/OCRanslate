const OcrClient = require('tencentcloud-sdk-nodejs').ocr.v20181119.Client;
const TesseractOcr = require('./TesseractOcr');
const fs = require('fs');
const path = require('path');
const Data = require('./Data');
const XunfeiOcr = require('./XunfeiOcr');
const YoudaoOcr = require('./YoudaoOcr');
const AliyunOCR = require('./AliyunOCR');
const BaiduOcr = require('./BaiduOcr');

module.exports = class Ocr {
  options = null;
  data = null;

  /**
   * 初始化 OCR 识别模块
   * @param {Object} optionsObj 配置对象
   */
  constructor(optionsObj) {
    this.options = optionsObj;
    this.data = new Data();
  }

  /**
   * 使用百度 OCR 进行文字识别
   * @param {string} type 识别类型（如标准版、高精度版）
   * @param {string} base64File Base64 编码的图片数据
   * @returns {Promise<Object>} 返回 {result, list/msg} 对象的 Promise
   */
  baidu(type, base64File) {
    if (type !== '百度云通用文字识别（标准版）' && type !== '百度云通用文字识别（高精度版）') {
      return Promise.resolve({result: 'error', msg: '不支持的 API 接口！'});
    }

    const baiduOcr = new BaiduOcr(this.options.baiduOcrApiKey, this.options.baiduOcrSecretKey);
    const request = type === '百度云通用文字识别（标准版）' ?
      baiduOcr.generalBasic(base64File, this.options.baiduOcrLanguageSelected) :
      baiduOcr.accurateBasic(base64File, this.options.baiduOcrLanguageSelected);

    return request.then(async result => {
      if (result.result === 'success') {
        await this.data.addOcrHistory('baidu', type);
      }
      return result;
    });
  }

  /**
   * 使用腾讯 OCR 进行文字识别
   * @param {string} type 识别类型（如标准版、高精度版、手写体等）
   * @param {string} base64File Base64 编码的图片数据
   * @returns {Promise<Object>} 返回 {result, list/msg} 对象的 Promise
   */
  tencent(type, base64File) {
    const client = new OcrClient({
      credential: {
        secretId: this.options.tencentOcrSecretID,
        secretKey: this.options.tencentOcrSecretKey
      },
      region: this.options.tencentOcrRegionSelected,
      profile: {
        httpProfile: {
          reqTimeout: 15000
        }
      }
    });

    return new Promise(resolve => {
      // 用来存储识别结果
      let result = null;
      // 根据传入的识别类型调用识别
      switch (type) {
        case '腾讯云通用印刷体识别':
          result = client.GeneralBasicOCR({
            ImageBase64: base64File,
            LanguageType: this.options.tencentOcrLanguageSelected
          });
          break;
        case '腾讯云通用印刷体识别（高精度版）':
          result = client.GeneralAccurateOCR({ImageBase64: base64File});
          break;
        case '腾讯云通用手写体识别':
          result = client.GeneralHandwritingOCR({ImageBase64: base64File});
          break;
        case '腾讯云广告文字识别':
          result = client.AdvertiseOCR({ImageBase64: base64File});
          break;
        case '腾讯云通用印刷体识别（精简版）':
          result = client.GeneralEfficientOCR({ImageBase64: base64File});
          break;
        case '腾讯云通用印刷体识别（高速版）':
          result = client.GeneralFastOCR({ImageBase64: base64File});
          break;
        default:
          resolve({result: 'error', msg: '不支持的 API 接口！'});
          return false;
      }

      result.then(async data => {
        // 添加 OCR 历史记录
        await this.data.addOcrHistory('tencent', type);
        // 把识别结果封装为数组返回
        const resultList = [];
        data.TextDetections.forEach(item => {
          resultList.push(item.DetectedText);
        });
        resolve({ result: 'success', list: resultList });
      }).catch(error => {
        resolve({result: 'error', msg: `${error.code} ${error.message}`});
      });
    });
  }

  /**
   * 使用讯飞 OCR 进行文字识别
   * @param {string} type 识别类型
   * @param {string} base64File Base64 编码的图片数据
   * @param {string} [imgType='png'] 图片类型，默认为 png
   * @returns {Promise<Object>} 返回识别结果 Promise
   */
  async xunfei(type, base64File, imgType = 'png') {
    const xunfeiOcr = new XunfeiOcr(this.options.xunfeiOcrAPPId, this.options.xunfeiOcrAPISecret, this.options.xunfeiOcrAPIKey);
    const result = await xunfeiOcr.submit(base64File, imgType);
    // 如果成功就添加 OCR 历史记录
    if (result.msg === undefined && result.code === undefined) {
      await this.data.addOcrHistory('xunfei', type);
    }
    return result;
  }

  /**
   * 使用有道智云 OCR 进行文字识别
   * @param {string} type 识别类型
   * @param {string} base64File Base64 编码的图片数据
   * @returns {Promise<Object>} 返回识别结果 Promise
   */
  async youdao(type, base64File) {
    const youdaoOcr = new YoudaoOcr(this.options.youdaoOcrAppID, this.options.youdaoOcrAppKey);
    const result = await youdaoOcr.submit(base64File, this.options.youdaoOcrLanguageSelected);
    // 如果成功就添加 OCR 历史记录
    if (result.msg === undefined && result.code === undefined) {
      await this.data.addOcrHistory('youdao', type);
    }
    return result;
  }

  /**
   * 使用阿里云 OCR 进行文字识别
   * @param {string} type 识别类型
   * @param {string} base64File Base64 编码的图片数据
   * @returns {Promise<Object>} 返回识别结果 Promise
   */
  async ali(type, base64File) {
    const aliyunOCR = new AliyunOCR(this.options.aliyunAccessKeyID, this.options.aliyunAccessKeySecret);
    let result = null;
    // 根据选择的接口名称调用识别
    if (type === '阿里云通用文字识别') {
      result = await aliyunOCR.recognizeGeneral(base64File);
    }else if (type === '阿里云全文识别高精版') {
      result = await aliyunOCR.recognizeAdvanced(base64File);
    }else {
      return {result: 'error', msg: '不支持的 API 接口！'};
    }
    // 如果成功就把识别记录添加到数据库
    if (result.result === 'success') {
      await this.data.addOcrHistory('ali', type);
    }
    return result;
  }

  /**
   * 读取文件并转换为 Base64 编码
   * @param {string} fileName 文件路径
   * @returns {string} 返回 Base64 编码的字符串
   */
  static fileToBase64(fileName) {
    return fs.readFileSync(fileName).toString('base64');
  }

  /**
   * 检查文件是否为图片格式
   * @param {string} fileName 文件路径
   * @returns {boolean} 返回是否为图片文件
   */
  static isImage(fileName) {
    const extnameList = ['.jpg', '.png', '.jpeg'];
    const extname = path.extname(fileName);
    return extnameList.indexOf(extname) >= 0;
  }

  /**
   * 使用 Tesseract 进行文字识别
   * @param {string} img 图片路径或数据
   * @returns {Promise<Object>} 返回识别结果 Promise
   */
  async tesseract(img) {
    const tesseractOcr = new TesseractOcr();
    const result = await tesseractOcr.recognize(img, this.options.tesseractOcrLanguageSelected);

    return result;
  }
}
