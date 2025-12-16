const crypto = require('crypto');
const axios = require('axios').default;

module.exports = class XunfeiOcr {
  host = 'api.xf-yun.com';  // 请求主机
  urlPath = '/v1/private/sf8e6aca1';  // 地址路径
  date = null;  // 时间戳
  APPId = '';
  APISecret = '';
  APIKey = '';

  /**
   * 初始化讯飞 OCR
   * @param {string} APPId 应用 ID
   * @param {string} APISecret API 密钥
   * @param {string} APIKey API 钥匙
   */
  constructor(APPId, APISecret, APIKey) {
    this.APPId = APPId;
    this.APISecret = APISecret;
    this.APIKey = APIKey;
  }

  /**
   * 发送 OCR 识别请求到讯飞 API
   * @param {string} base64Img Base64 编码的图片数据
   * @param {string} imgType 图片类型（如 base64、url 等）
   * @returns {Promise<Object>} 返回 {result, list/msg} 对象的 Promise，成功时包含识别出的文字列表
   */
  submit(base64Img, imgType) {
    // 要提交的数据
    const submitData = {
      header: { app_id: this.APPId, status: 3 },
      parameter: {
        sf8e6aca1: {
          category: 'ch_en_public_cloud',
          result: {
            encoding: 'utf8',
            compress: 'raw',
            format: 'json'
          }
        }
      },
      payload: {
        sf8e6aca1_data_1: {
          encoding: imgType,
          status: 3,
          image: base64Img
        }
      }
    };
    // 获取 authorization
    const authorization = this.getAuthorization();
    const url = `https://${this.host}${this.urlPath}?authorization=${authorization}&host=${this.host}&date=${this.date}`;
    return new  Promise(resolve => {
      axios({
        url: url,
        method: 'post',
        data: JSON.stringify(submitData),
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(result => {
        // 识别出错
        if (result.data.header.message !== 'success') {
          resolve({
            result: 'error',
            msg: `${result.data.header.code} ${result.data.header.message}`
          });
          return false;
        }

        // 获取识别结果
        let text = null;
        try {
          text = Buffer.from(result.data.payload.result.text, 'base64').toString('utf-8');
          text = JSON.parse(text);
        } catch (error) {
          resolve({result: 'error', msg: error.message});
          return false;
        }
        // 是否按照预期返回识别结果
        if (text.pages?.[0].lines === undefined || text.pages?.[0].lines?.[0].words?.[0].content === undefined) {
          resolve({result: 'error', msg: '讯飞服务器未能返回识别文字！'});
          return false;
        }
        const textList = [];
        // 获取每一行的文字
        text.pages[0].lines.forEach(val => {
          if (val.words?.[0].content !== undefined) textList.push(val.words[0].content);
        });
        resolve({result: 'success', list: textList});
      }).catch(error => {
        if (error.response) {
          resolve({
            result: 'error',
            msg: `${error.response.status} ${error.response.data.message}`
          });
        }else {
          resolve({result: 'error', msg: `${error.code} ${error.message}`});
        }
      });
    });
  }

  /**
   * 生成 Authorization 认证头
   * @returns {string} 返回 Base64 编码的 Authorization 认证字符串
   */
  getAuthorization() {
    // 生成时间戳，RFC1123格式("EEE, dd MMM yyyy HH:mm:ss z")
    this.date = new Date().toUTCString();
    // 生成 signature
    let signature = `host: ${this.host}\ndate: ${this.date}\nPOST ${this.urlPath} HTTP/1.1`;
    // 使用 hmac-sha256 算法结合 apiSecret 对 signature 签名
    signature = crypto.createHmac('sha256', this.APISecret).update(signature).digest('base64');
    // 拼接 authorization
    const authorization = `api_key="${this.APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    // authorization base64编码
    return Buffer.from(authorization).toString('base64');
  }
}