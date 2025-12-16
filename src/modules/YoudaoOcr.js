const axios = require('axios').default;
const crypto = require('crypto');
const querystring = require('querystring');

module.exports = class YoudaoOcr {
  appId = null;
  appKey = null;

  /**
   * 初始化有道 OCR
   * @param {string} appId 应用 ID
   * @param {string} appKey 应用密钥
   */
  constructor(appId, appKey) {
    this.appId = appId;
    this.appKey = appKey;
  }

  /**
   * 提交 OCR 识别请求到有道 API
   * @param {string} base64Img Base64 编码的图片数据
   * @param {string} [langType='auto'] 语言类型，默认为自动识别
   * @returns {Promise<Object>} 返回 {result, list/msg} 对象的 Promise，成功时包含识别出的文字列表
   */
  submit(base64Img, langType = 'auto') {
    // 获取要提交的数据
    const queryData = this.submitData(base64Img, langType);

    return new Promise(resolve => {
      axios({
        url: 'https://openapi.youdao.com/ocrapi',
        method: 'post',
        data: queryData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(result => {
        // 是否出错
        if (result.data.errorCode !== '0' && result.data.msg !== undefined) {
          resolve({result: 'error', msg: `${result.data.errorCode} ${result.data.msg}`});
          return false;
        }

        // 是否按照格式返回结果
        if (result.data.Result === undefined || result.data.Result.regions?.[0].lines?.[0].text === undefined) {
          resolve({result: 'error', msg: '有道服务器未能返回识别文字！'});
          return false;
        }

        const textList = [];  // 存放识别结果
        result.data.Result.regions.forEach(val => {
          textList.push(val.lines[0].text);
        });
        resolve({result: 'success', list: textList});
      }).catch(error => {
        if (error.response) {
          resolve({result: 'error', msg: `${error.response.status} ${error.message}`});
        }else {
          resolve({result: 'error', msg: `${error.code} ${error.message}`});
        }
      });
    });
  }

  /**
   * 生成提交数据及签名
   * @param {string} base64Img Base64 编码的图片数据
   * @param {string} langType 语言类型
   * @returns {string} 返回 URL 编码的查询字符串数据
   */
  submitData(base64Img, langType) {
    const data = {
      // 生成 UUID
      salt: crypto.randomUUID(),
      // 语言
      langType: langType,
      // 按行识别：10012
      detectType: '10012',
      imageType: '1',
      appKey: this.appId,
      docType: 'json',
      signType: 'v3',
      curtime: Math.round(new Date().getTime() / 1000),
      angle: '0',
      // 是否按多列识别
      column: 'onecolumn',
      rotate: 'rotate',
      img: base64Img
    };

    // input的计算方式为：input=img前10个字符 + img长度 + img后十个字符
    const input = `${data.img.slice(0, 10)}${data.img.length}${data.img.slice(-10)}`;
    // 生成签名
    const sign = `${data.appKey}${input}${data.salt}${data.curtime}${this.appKey}`;
    data.sign = crypto.createHash('sha256').update(sign).digest('hex');
    // 把要提交的数据转换为 url query
    return querystring.stringify(data);
  }
}