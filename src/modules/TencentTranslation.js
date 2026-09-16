const crypto = require('crypto');
const axios = require('axios').default;

module.exports = class TencentTranslation {
  secretId = '';
  secretKey = '';
  region = 'ap-shanghai';
  host = 'tmt.tencentcloudapi.com';
  service = 'tmt';
  version = '2018-03-21';

  /**
   * 初始化腾讯云机器翻译
   * @param {string} secretId 腾讯云 SecretId
   * @param {string} secretKey 腾讯云 SecretKey
   * @param {string} [region='ap-shanghai'] 地域，默认为 ap-shanghai
   */
  constructor(secretId, secretKey, region = 'ap-shanghai') {
    this.secretId = secretId;
    this.secretKey = secretKey;
    this.region = region;
  }

  /**
   * 生成字符串的 SHA256 哈希值
   * @param {string} data 要哈希的字符串
   * @returns {string} 十六进制哈希值
   */
  hash(data) {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }

  /**
   * 生成 HMAC-SHA256 签名
   * @param {string} data 待签名字符串
   * @param {string|Buffer} key 签名密钥
   * @param {string} [digest='hex'] 输出格式，默认为 hex
   * @returns {string|Buffer} 签名结果
   */
  hmac(data, key, digest = 'hex') {
    return crypto.createHmac('sha256', key).update(data, 'utf8').digest(digest);
  }

  /**
   * 请求腾讯云翻译接口
   * @param {string} action 接口名称
   * @param {Object} payload 接口请求参数
   * @returns {Promise<Object>} 返回接口响应的 Promise
   */
  async request(action, payload) {
    const payloadString = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
    const signedHeaders = 'content-type;host';
    const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${this.host}\n`;
    const canonicalRequest = [
      'POST',
      '/',
      '',
      canonicalHeaders,
      signedHeaders,
      this.hash(payloadString)
    ].join('\n');
    const credentialScope = `${date}/${this.service}/tc3_request`;
    const stringToSign = [
      'TC3-HMAC-SHA256',
      timestamp,
      credentialScope,
      this.hash(canonicalRequest)
    ].join('\n');
    const dateKey = this.hmac(date, `TC3${this.secretKey}`, 'buffer');
    const serviceKey = this.hmac(this.service, dateKey, 'buffer');
    const signingKey = this.hmac('tc3_request', serviceKey, 'buffer');
    const signature = this.hmac(stringToSign, signingKey);
    const authorization = `TC3-HMAC-SHA256 Credential=${this.secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    try {
      const response = await axios.post(`https://${this.host}`, payloadString, {
        timeout: 30000,
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json; charset=utf-8',
          'X-TC-Action': action,
          'X-TC-Region': this.region,
          'X-TC-Timestamp': timestamp.toString(),
          'X-TC-Version': this.version
        }
      });
      return response.data;
    } catch (error) {
      const responseData = error.response && error.response.data;
      if (responseData && responseData.Response && responseData.Response.Error) {
        return responseData;
      }
      throw error;
    }
  }

  /**
   * 提交文本翻译
   * @param {string} q 要翻译的内容
   * @param {string} [from='auto'] 原文语言，默认为 auto 自动识别
   * @param {string} [to='zh'] 译文语言，默认为 zh 中文
   * @returns {Promise<{result: "success", data: {from: string, to: string, trans_result: Array<{src: string, dst: string}>}}|{result: "error", msg: string}>} 翻译结果
   */
  async submit(q, from = 'auto', to = 'zh') {
    try {
      // 去除原文内容的空行
      const sourceText = q.replace(/^\s*[\r\n]/gm, '');
      const response = await this.request('TextTranslate', {
        SourceText: sourceText,
        Source: from,
        Target: to,
        ProjectId: 0
      });

      if (response.Response && response.Response.Error) {
        const code = response.Response.Error.Code || '';
        const message = response.Response.Error.Message || '腾讯服务器未能返回翻译结果';
        return {result: 'error', msg: `${code} ${message}`.trim()};
      }
      if (!response.Response || typeof response.Response.TargetText !== 'string') {
        return {result: 'error', msg: '腾讯服务器未能返回翻译结果'};
      }

      const sourceList = sourceText.split('\n');
      const targetList = response.Response.TargetText.split('\n');
      const transResult = [];
      for (let index = 0; index < targetList.length; index++) {
        transResult.push({
          src: sourceList[index],
          dst: targetList[index]
        });
      }

      return {
        result: 'success',
        data: {
          from: response.Response.Source,
          to: response.Response.Target,
          trans_result: transResult
        }
      };
    } catch (error) {
      const msg = error.response ? `${error.response.status} ${error.message}` : `${error.code} ${error.message}`;
      return {result: 'error', msg};
    }
  }
};
