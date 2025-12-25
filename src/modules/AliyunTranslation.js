// AliyunTranslate.js
const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');

module.exports = class AliyunTranslation {
  /**
   * @param {string} accessKeyId
   * @param {string} accessKeySecret
   * @param {string} [endpoint] - 默认 "https://mt.cn-hangzhou.aliyuncs.com"
   */
  constructor(accessKeyId, accessKeySecret, endpoint) {
    if (!accessKeyId || !accessKeySecret) {
      throw new Error('accessKeyId 和 accessKeySecret 必须提供');
    }
    this.accessKeyId = accessKeyId;
    this.accessKeySecret = accessKeySecret;
    this.endpoint = endpoint || 'https://mt.cn-hangzhou.aliyuncs.com';
    this.timeout = 15000;
  }

  // RFC 3986 风格的 percent-encode
  _percentEncode(str) {
    return encodeURIComponent(str)
      .replace(/\+/g, '%20')
      .replace(/%2A/g, '%2A')
      .replace(/%7E/g, '~');
  }

  // ISO8601 时间，去掉毫秒，示例：2025-12-24T10:41:57Z
  _nowISO8601() {
    return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  // UUID，用作 SignatureNonce
  _uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ (crypto.randomBytes(1)[0] & (15 >> (c / 4)))).toString(16)
    );
  }

  /**
   * 构建签名过的请求 URL（把所有参数都作为 query string）
   * @param {object} params - 业务参数（SourceText, SourceLanguage, TargetLanguage, FormatType...）
   * @param {string} method - 'GET' 或 'POST'
   */
  _buildSignedUrl(params = {}, method = 'POST') {
    // 公共参数（RPC 风格）
    const baseParams = {
      Format: 'JSON',
      Version: '2018-10-12',
      AccessKeyId: this.accessKeyId,
      SignatureMethod: 'HMAC-SHA1',
      SignatureVersion: '1.0',
      SignatureNonce: this._uuid(),
      Timestamp: this._nowISO8601(),
      Action: 'TranslateGeneral'
      // RegionId 通常可不必设置；若需要请在外部传入 params.RegionId
    };

    // 合并（业务参数覆盖 baseParams 中的同名键）
    const all = Object.assign({}, baseParams, params);

    // 过滤空值并排序
    const keys = Object.keys(all)
      .filter(k => all[k] !== undefined && all[k] !== null && String(all[k]) !== '')
      .sort();

    // canonicalized query string (未包含 Signature)
    const canonical = keys
      .map(k => `${this._percentEncode(k)}=${this._percentEncode(String(all[k]))}`)
      .join('&');

    // stringToSign
    const stringToSign = `${method.toUpperCase()}&${this._percentEncode('/')}&${this._percentEncode(canonical)}`;

    // HMAC-SHA1，key = AccessKeySecret + '&'
    const signature = crypto
      .createHmac('sha1', this.accessKeySecret + '&')
      .update(stringToSign, 'utf8')
      .digest('base64');

    // 最终 URL（把 Signature 放在 query 中）
    const finalUrl = `${this.endpoint}/?${canonical}&Signature=${this._percentEncode(signature)}`;
    return finalUrl;
  }

  /**
   * 调用通用翻译接口
   * @param {string} text - 要翻译的文本（必填）
   * @param {string} [source='auto'] - 原文语言，如 'auto' 或 'en' 或 'zh' 等
   * @param {string} [target='zh'] - 目标语言
   * @returns {Promise<{result: 'success', translated: string, detectedLanguage?: string, raw: object} | {result: 'error', msg: string}>}
   */
  async translateGeneral(text, source = 'auto', target = 'zh') {
    if (!text || typeof text !== 'string') {
      return { result: 'error', msg: 'text 必须是非空字符串' };
    }

    // 业务参数（文档里有更多可选字段，如 FormatType:text/html 等）
    const bizParams = {
      FormatType: 'text', // 可改成 "html" 如需
      SourceLanguage: source,
      TargetLanguage: target,
      SourceText: text
    };

    // 构建带签名的 URL（签名时已经把业务参数包含进去）
    const url = this._buildSignedUrl(bizParams, 'POST');

    try {
      // 并且把业务参数也放到请求体（虽然签名已包含这些参数），以兼容各种实现。
      // axios 在 node 环境里若第二个参数为 null 会发送空 body，这里我们把 body 写成 form string。
      const formBody = querystring.stringify(bizParams);

      const res = await axios.post(url, formBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'AliyunTranslate-NodeClient'
        },
        timeout: this.timeout,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      // 阿里服务器返回的错误信息
      if (res.data.Code !== 200 && res.data.Message !== undefined) {
        return {result: 'error', msg: res.data.Message};
      }
      // 如果服务器未按预期返回
      if (
        res.data.Data === undefined ||
        res.data.Data?.WordCount === undefined ||
        res.data.Data?.Translated === undefined
      ) {
        return {result: 'error', msg: '阿里服务器未能返回翻译结果'};
      }
      // 按照百度翻译的格式返回数据
      const returnData = {
        from: res.data.Data?.DetectedLanguage === undefined ? source : res.data.Data?.DetectedLanguage,
        to: target,
        trans_result: [],
        word_count: res.data.Data?.WordCount
      };
      // 把原文和译文使用换行符拆分为数组
      const src = text.split('\n');
      const dst = res.data.Data?.Translated.split('\n');
      // 把原文和译文加入翻译结果
      for (let i = 0;i < dst.length;i ++) {
        returnData.trans_result.push({
          src: src[i],
          dst: dst[i]
        });
      }

      return {result: 'success', data: returnData};
    }catch (error) {
      // 如果阿里服务器返回了错误信息就返回错误信息
      if (error.response.data.Message !== undefined) {
        return {result: 'error', msg: error.response.data.Message};
      }
      // 如果阿里服务器没有返回错误信息就返回请求错误的信息
      if (error.message !== undefined) {
        return {result: 'error', msg: error.message};
      }
      // 如果没有任何错误信息
      return {result: 'error', msg: '未知错误'};
    }
  }
}