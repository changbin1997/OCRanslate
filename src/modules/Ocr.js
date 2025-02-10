const AipOcrClient = require('baidu-aip-sdk').ocr;
const HttpClient = require('baidu-aip-sdk').HttpClient;
const OcrClient = require('tencentcloud-sdk-nodejs').ocr.v20181119.Client;
const TesseractOcr = require('./TesseractOcr');
const fs = require('fs');
const path = require('path');
const Data = require('./Data');
const XunfeiOcr = require('./XunfeiOcr');
const YoudaoOcr = require('./YoudaoOcr');

module.exports = class Ocr {
  options = null;
  data = null;

  constructor(optionsObj) {
    this.options = optionsObj;
    this.data = new Data();
  }

  // 百度 OCR 识别
  baidu(type, base64File) {
    // 配置百度 SDK 的网络
    HttpClient.setRequestOptions({timeout: 15000});

    const client = new AipOcrClient(this.options.baiduOcrAppID, this.options.baiduOcrApiKey, this.options.baiduOcrSecretKey);
    // 调整返回的内容
    return new Promise((resolve) => {
      let result = null;
      if (type === '百度云通用文字识别（标准版）') {
        // 通用文字识别
        result = client.generalBasic(base64File, {
          language_type: this.options.baiduOcrLanguageSelected
        });
      } else if (type === '百度云通用文字识别（高精度版）') {
        result = client.accurateBasic(base64File, {
          language_type: this.options.baiduOcrLanguageSelected
        });
      }else {
        resolve({result: 'error', msg: '不支持的 API 接口！'});
        return false;
      }

      result.then(async data => {
        // 是否出错
        if (data.error_msg !== undefined && data.error_code !== undefined) {
          resolve({result: 'error', msg: `${data.error_code} ${data.error_msg}`});
          return false;
        }

        // 添加 OCR 历史记录
        await this.data.addOcrHistory('baidu', type);
        // 只返回识别内容数组
        const resultList = [];
        data.words_result.forEach(item => {
          resultList.push(item.words);
        });
        // 如果没有识别到文字就不返回识别内容
        if (resultList.length < 1) {
          resolve({result: 'error', msg: '没有识别到任何文字！'});
        }else {
          resolve({result: 'success', list: resultList});
        }
      }).catch(error => {
        // 是否请求到百度服务器
        if (error.error_msg !== undefined && error.error_code !== undefined) {
          resolve({result: 'error', msg: `${error.error_code} ${error.error_msg}`});
        }else {
          resolve({result: 'error', msg: '无法访问百度 API 服务器！'});
        }
      })
    });
  }

  // 腾讯 OCR 识别
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

  // 讯飞 OCR 识别
  async xunfei(type, base64File, imgType = 'png') {
    const xunfeiOcr = new XunfeiOcr(this.options.xunfeiOcrAPPId, this.options.xunfeiOcrAPISecret, this.options.xunfeiOcrAPIKey);
    const result = await xunfeiOcr.submit(base64File, imgType);
    // 如果成功就添加 OCR 历史记录
    if (result.msg === undefined && result.code === undefined) {
      await this.data.addOcrHistory('xunfei', type);
    }
    return result;
  }

  // 有道智云OCR
  async youdao(type, base64File) {
    const youdaoOcr = new YoudaoOcr(this.options.youdaoOcrAppID, this.options.youdaoOcrAppKey);
    const result = await youdaoOcr.submit(base64File, this.options.youdaoOcrLanguageSelected);
    // 如果成功就添加 OCR 历史记录
    if (result.msg === undefined && result.code === undefined) {
      await this.data.addOcrHistory('youdao', type);
    }
    return result;
  }

  // 读取文件并转换为 base64
  static fileToBase64(fileName) {
    return fs.readFileSync(fileName).toString('base64');
  }

  // 检查是否是图片
  static isImage(fileName) {
    const extnameList = ['.jpg', '.png', '.jpeg'];
    const extname = path.extname(fileName);
    return extnameList.indexOf(extname) >= 0;
  }

  // Tesseract OCR
  async tesseract(img) {
    const tesseractOcr = new TesseractOcr();
    const result = await tesseractOcr.recognize(img, this.options.tesseractOcrLanguageSelected);

    return result;
  }
}