const crypto = require('crypto');
const axios = require('axios').default;

module.exports = class TencentOcr {
  secretId = '';
  secretKey = '';
  region = 'ap-shanghai';
  host = 'ocr.tencentcloudapi.com';
  service = 'ocr';
  version = '2018-11-19';

  /**
   * 初始化腾讯云 OCR
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
   * 请求腾讯云 OCR 接口
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
   * 调用 OCR 接口并整理识别结果
   * @param {string} action 腾讯云 OCR 接口名称
   * @param {string} base64File Base64 编码的图片数据
   * @param {Object} [payload={}] 额外接口请求参数
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 识别结果
   */
  async recognize(action, base64File, payload = {}) {
    try {
      // 去除可能存在的 Data URL 前缀
      const imageBase64 = base64File.includes(',') ? base64File.split(',')[1] : base64File;
      const response = await this.request(action, {
        ...payload,
        ImageBase64: imageBase64
      });

      if (response.Response && response.Response.Error) {
        const code = response.Response.Error.Code || '';
        const message = response.Response.Error.Message || '腾讯服务器未能返回识别文字';
        return {result: 'error', msg: `${code} ${message}`.trim()};
      }
      if (!response.Response || !Array.isArray(response.Response.TextDetections)) {
        return {result: 'error', msg: '腾讯服务器未能返回识别文字'};
      }

      const list = [];
      for (const item of response.Response.TextDetections) {
        list.push(item.DetectedText);
      }
      return {result: 'success', list};
    } catch (error) {
      const msg = error.response ? `${error.response.status} ${error.message}` : `${error.code} ${error.message}`;
      return {result: 'error', msg};
    }
  }

  /**
   * 通用印刷体识别
   * @param {string} base64File Base64 编码的图片数据
   * @param {string} [LanguageType='zh_rare'] 识别语言类型，默认为中文简繁体混合
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 识别结果
   */
  async GeneralBasicOCR(base64File, LanguageType = 'zh_rare') {
    return this.recognize('GeneralBasicOCR', base64File, {LanguageType});
  }

  /**
   * 通用印刷体识别（高精度版）
   * @param {string} base64File Base64 编码的图片数据
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 识别结果
   */
  async GeneralAccurateOCR(base64File) {
    return this.recognize('GeneralAccurateOCR', base64File);
  }

  /**
   * 通用手写体识别
   * @param {string} base64File Base64 编码的图片数据
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 识别结果
   */
  async GeneralHandwritingOCR(base64File) {
    return this.recognize('GeneralHandwritingOCR', base64File);
  }

  /**
   * 广告文字识别
   * @param {string} base64File Base64 编码的图片数据
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 识别结果
   */
  async AdvertiseOCR(base64File) {
    return this.recognize('AdvertiseOCR', base64File);
  }

  /**
   * 通用印刷体识别（精简版）
   * @param {string} base64File Base64 编码的图片数据
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 识别结果
   */
  async GeneralEfficientOCR(base64File) {
    return this.recognize('GeneralEfficientOCR', base64File);
  }

  /**
   * 通用印刷体识别（高速版）
   * @param {string} base64File Base64 编码的图片数据
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 识别结果
   */
  async GeneralFastOCR(base64File) {
    return this.recognize('GeneralFastOCR', base64File);
  }
};
