const crypto = require('crypto');
const querystring = require('querystring');
const axios = require('axios').default;

module.exports = class BaiduTranslation {
  options = null;
  data = null;

  constructor(optionsObj) {
    this.options = optionsObj;
  }

  /**
   * 生成签名
   * @param {string} query 查询字符串
   * @param {number} salt 随机数
   * @returns {string} 签名哈希值
   */
  signature(query, salt) {
    const signature = this.options.baiduTranslationAppID + query + salt + this.options.baiduTranslationApiKey;
    const md5 = crypto.createHash('md5');
    return md5.update(signature).digest('hex');
  }

  /**
   * 生成随机数
   * @param {number} max 最大值
   * @param {number} min 最小值
   * @returns {number} 随机数
   */
  rand(max, min) {
    const num = max - min;
    return Math.round(Math.random() * num + min);
  }

  /**
   * 发送翻译请求到百度翻译 API
   * @param {string} q 要翻译的文本
   * @param {string} from 源语言
   * @param {string} to 目标语言
   * @returns {Promise<Object>} 返回 {result, msg/data} 对象的 Promise
   */
  send(q, from, to) {
    // 生成一个随机数
    const randerNum = this.rand(999999, 111111);
    // 获取签名
    const sign = this.signature(q, randerNum);
    // 要发送的数据
    const submitData = {
      q: q,
      from: from,
      to: to,
      appid: this.options.baiduTranslationAppID,
      salt: randerNum,
      sign: sign
    };

    return new Promise((resolve) => {
      axios({
        url: 'https://api.fanyi.baidu.com/api/trans/vip/translate',
        method: 'post',
        data: querystring.stringify(submitData),
        timeout: 15000,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      }).then(async result => {
        // 百度返回的不是 JSON 格式
        if (typeof result.data === "string") {
          resolve({result: 'error', msg: '百度翻译服务器未能返回翻译数据！'});
          return false;
        }

        // API出错
        if (result.data.error_code !== undefined && result.data.error_msg !== undefined) {
          resolve({ result: 'error', msg: `${result.data.error_code} ${result.data.error_msg}` });
          return  false;
        }

        // 百度服务器是否返回翻译结果
        if (result.data.trans_result === undefined || result.data.trans_result.length < 1) {
          resolve({result: 'error', msg: '百度翻译未能返回翻译结果！'});
          return false;
        }

        resolve({ result: 'success', data: result.data });
      }).catch(error => {
        if (error.response) {
          resolve({ result: 'error', msg: `${error.response.status} ${error.message}` });
        }else {
          resolve({result: 'error', msg: `${error.code} ${error.message}`});
        }
      });
    });
  }
};