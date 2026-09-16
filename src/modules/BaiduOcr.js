const querystring = require('querystring');
const axios = require('axios').default;

module.exports = class BaiduOcr {
  apiKey = '';
  secretKey = '';
  accessToken = null;
  accessTokenExpiresAt = 0;

  /**
   * 初始化百度 OCR
   * @param {string} apiKey 百度 API Key
   * @param {string} secretKey 百度 Secret Key
   */
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  /**
   * 获取并缓存百度 Access Token
   * @returns {Promise<string>} 返回 Access Token 的 Promise
   */
  async getAccessToken() {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const response = await axios.get('https://aip.baidubce.com/oauth/2.0/token', {
      params: {
        grant_type: 'client_credentials',
        client_id: this.apiKey,
        client_secret: this.secretKey
      },
      timeout: 30000
    });
    const data = response.data;

    if (!data || !data.access_token || !data.expires_in) {
      const msg = data && (data.error_description || data.error) || '百度鉴权服务器未能返回 Access Token';
      throw new Error(msg);
    }

    this.accessToken = data.access_token;
    this.accessTokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    return this.accessToken;
  }

  /**
   * 调用百度 OCR 接口并整理识别结果
   * @param {string} apiName 百度 OCR 接口名称
   * @param {string} base64File Base64 编码的图片数据
   * @param {string} languageType 识别语言类型
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 识别结果
   */
  async request(apiName, base64File, languageType) {
    try {
      const accessToken = await this.getAccessToken();
      // 去除可能存在的 Data URL 前缀
      const image = base64File.includes(',') ? base64File.split(',')[1] : base64File;
      const response = await axios.post(
        `https://aip.baidubce.com/rest/2.0/ocr/v1/${apiName}`,
        querystring.stringify({
          image: image,
          language_type: languageType
        }),
        {
          params: {access_token: accessToken},
          timeout: 30000,
          headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }
      );
      const data = response.data;

      if (data && data.error_code !== undefined && data.error_msg !== undefined) {
        return {result: 'error', msg: `${data.error_code} ${data.error_msg}`};
      }
      if (!data || !Array.isArray(data.words_result)) {
        return {result: 'error', msg: '百度服务器未能返回识别内容'};
      }

      const list = [];
      for (const item of data.words_result) {
        list.push(item.words);
      }
      if (list.length < 1) {
        return {result: 'error', msg: '没有识别到任何文字！'};
      }

      return {result: 'success', list};
    } catch (error) {
      const responseData = error.response && error.response.data;
      if (responseData && responseData.error_code !== undefined && responseData.error_msg !== undefined) {
        return {result: 'error', msg: `${responseData.error_code} ${responseData.error_msg}`};
      }
      if (error.response) {
        return {result: 'error', msg: `${error.response.status} ${error.message}`};
      }
      return {result: 'error', msg: `${error.code} ${error.message}`};
    }
  }

  /**
   * 通用文字识别（标准版）
   * @param {string} base64File Base64 编码的图片数据
   * @param {string} [languageType='CHN_ENG'] 识别语言类型，默认为中英文混合
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 识别结果
   */
  async generalBasic(base64File, languageType = 'CHN_ENG') {
    return this.request('general_basic', base64File, languageType);
  }

  /**
   * 通用文字识别（高精度版）
   * @param {string} base64File Base64 编码的图片数据
   * @param {string} [languageType='CHN_ENG'] 识别语言类型，默认为中英文混合
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 识别结果
   */
  async accurateBasic(base64File, languageType = 'CHN_ENG') {
    return this.request('accurate_basic', base64File, languageType);
  }
};
