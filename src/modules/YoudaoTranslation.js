const axios = require('axios').default;
const queryString = require('querystring');
const crypto = require('crypto');
const DateTime = require('./Datetime');

module.exports = class YoudaoTranslation {
  appId = '';
  appKey = '';
  curtime = null;
  salt = '';

  constructor(appId, appKey) {
    this.appId = appId;
    this.appKey = appKey;
    // 获取当前的时间戳
    this.curtime = DateTime.timestamp();
    // 生成UUID
    this.salt = crypto.randomUUID();
  }

  /**
   * 发送翻译请求到有道翻译 API
   * @param {string} q 要翻译的文本
   * @param {string} [from='auto'] 源语言，默认为自动识别
   * @param {string} [to='zh-CHS'] 目标语言，默认为简体中文
   * @returns {Promise<Object>} 返回 {result, msg/data} 对象的 Promise
   */
  submit(q, from = 'auto', to = 'zh-CHS') {
    // 获取签名
    const sign = this.signature(q);
    // 要发送的内容
    const submitData = {
      q: q,
      from: from,
      to: to,
      appKey: this.appId,
      signType: 'v3',
      salt: this.salt,
      curtime: this.curtime,
      sign: sign
    };

    return new Promise(resolve => {
      axios({
        url: 'https://openapi.youdao.com/api',
        method: 'post',
        data: queryString.stringify(submitData),
        timeout: 15000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      }).then(result => {
        // 翻译出错
        if (result.data.errorCode !== '0') {
          resolve({result: 'error', msg: `Error ${result.data.errorCode}`});
          return false;
        }

        // 把原文和译文按照行拆分为数组
        const dst = result.data.translation[0].split('\n');
        const src = result.data.query.split('\n');
        // 获取翻译语言
        const language = result.data.l.split('2');
        // 按照百度翻译的格式返回数据
        const returnResult = {
          from: language[0],
          to: language[1],
          trans_result: []
        };
        // 把拆分的原文和译文加入到返回结果
        for (let i = 0;i < dst.length;i ++) {
          returnResult.trans_result.push({
            src: src[i],
            dst: dst[i]
          });
        }

        resolve({result: 'success', data: returnResult});
      }).catch(error => {
        if (error.response) {
          resolve({ result: 'error', msg: `${error.response.status} ${error.message}` });
        }else {
          resolve({result: 'error', msg: `${error.code} ${error.message}`});
        }
      });
    });
  }

  /**
   * 生成签名
   * @param {string} q 要签名的文本
   * @returns {string} 签名哈希值
   */
  signature(q) {
    let input = q;
    if (q.length > 20) input = `${q.slice(0, 10)}${q.length}${q.slice(-10)}`;
    // 拼接签名
    const sign = `${this.appId}${input}${this.salt}${this.curtime}${this.appKey}`;
    return crypto.createHash('sha256').update(sign).digest('hex');
  }
}