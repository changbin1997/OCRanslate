const crypto = require('crypto');
const axios = require('axios').default;

module.exports = class XunfeiTranslation {
  host = 'itrans.xfyun.cn';  // 请求主机
  urlPath = '/v2/its';  // 地址路径
  date = null;  // 时间戳
  APPId = '';
  APISecret = '';
  APIKey = '';

  /**
   * 初始化讯飞翻译
   * @param {string} APPId 应用 ID
   * @param {string} APISecret API 密钥
   * @param {string} APIKey API 钥匙
   */
  constructor(APPId, APISecret, APIKey) {
    this.APPId = APPId;
    this.APISecret = APISecret;
    this.APIKey = APIKey;
    // 生成时间戳，RFC1123格式("EEE, dd MMM yyyy HH:mm:ss z")
    this.date = new Date().toUTCString();
  }

  /**
   * 提交翻译请求到讯飞翻译 API
   * @param {string} text 要翻译的文本
   * @param {string} [from='en'] 源语言，默认为英文
   * @param {string} [to='cn'] 目标语言，默认为中文
   * @returns {Object|Promise<Object>} 返回 {result, msg/data} 对象或其 Promise
   */
  submit(text, from = 'en', to = 'cn') {
    text = Buffer.from(text).toString('base64');
    // 翻译内容是否超出限制
    if (text.length > 1024) {
      return {result: 'error', msg: '翻译内容转换为 base64 后超过了 1024 字节！'};
    }

    // 要发送的数据
    const submitData = {
      common: {
        app_id: this.APPId
      },
      business: {
        from: from,
        to: to
      },
      data: {
        text: text
      }
    };
    // 获取 authorization
    const authorization = this.getAuthorization(submitData);
    // 请求的 URL
    const url = `https://${this.host}${this.urlPath}`;
    // 发送的 headers
    const headers = {
      'Content-Type': 'application/json',
      Authorization: authorization.authorization,
      Host: this.host,
      Date: this.date,
      Digest: authorization.digest,
      Accept: 'application/json,version=1.0'
    };

    // 发送请求
    return new Promise(resolve => {
      axios({
        url: url,
        method: 'post',
        data: JSON.stringify(submitData),
        headers: headers
      }).then(result => {
        // 翻译是否出错
        if (result.data.message !== 'success') {
          resolve({result: 'error', msg: result.data.message});
          return false;
        }
        // 讯飞服务器是否返回翻译结果
        if (result.data.data.result === undefined || result.data.data.result.trans_result === undefined) {
          resolve({result: 'error', msg: '讯飞服务器未能返回翻译结果！'});
          return false;
        }
        // 把翻译结果对象转换为数组
        result.data.data.result.trans_result = [result.data.data.result.trans_result];

        resolve({result: 'success', data: result.data.data.result});
      }).catch(error => {
        resolve({result: 'error', msg: error.message});
      });
    });
  }

  /**
   * 生成 Authorization 认证头和 Digest 摘要
   * @param {Object} submitData 要提交的数据对象
   * @returns {Object} 返回 {authorization, digest} 对象
   */
  getAuthorization(submitData) {
    // 生成 Digest
    submitData = JSON.stringify(submitData);
    const Digest = `SHA-256=${crypto.createHash('sha256').update(submitData).digest('base64')}`;
    // 生成 signature
    let signature = `host: ${this.host}\ndate: ${this.date}\nPOST ${this.urlPath} HTTP/1.1\ndigest: ${Digest}`;
    // 使用 hmac-sha256 算法结合 apiSecret 对 signature 签名
    signature = crypto.createHmac('sha256', this.APISecret).update(signature).digest('base64');
    // 返回 authorization
    return {
      authorization: `api_key="${this.APIKey}", algorithm="hmac-sha256", headers="host date request-line digest", signature="${signature}"`,
      digest: Digest
    };
  }
}