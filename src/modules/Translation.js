const Data = require('./Data');
const TmtClient = require('tencentcloud-sdk-nodejs').tmt.v20180321.Client;
const BaiduTranslation = require('./BaiduTranslation');  // 百度翻译模块
const XunfeiTranslation = require('./XunfeiTranslation');  // 讯飞翻译模块
const YoudaoTranslation = require('./YoudaoTranslation');  // 有道翻译模块

module.exports = class Translation {
  options = null;
  data = null;

  /**
   * 初始化翻译模块
   * @param {Object} optionsObj 配置对象
   */
  constructor(optionsObj) {
    this.options = optionsObj;
    this.data = new Data();
  }

  /**
   * 根据配置的翻译服务提供商进行翻译
   * @param {string} q 要翻译的文本
   * @param {string} [from='auto'] 源语言，默认为自动识别
   * @param {string} [to='zh'] 目标语言，默认为中文
   * @returns {Promise<Object>} 返回翻译结果 Promise，成功时为 {result, data}，失败时为 {result, msg}
   */
  async translation(q, from = 'auto', to = 'zh') {
    // 根据设置的翻译接口调用翻译
    const result = await this[this.options.translationProvider](q, from, to);
    // 如果翻译成功就添加翻译记录
    if (result.result === 'success') {
      await this.data.addTranslationHistory(this.options.translationProvider, q.length);
    }

    return result;
  }

  /**
   * 使用百度翻译进行文本翻译
   * @param {string} q 要翻译的文本
   * @param {string} [from='auto'] 源语言，默认为自动识别
   * @param {string} [to='zh'] 目标语言，默认为中文
   * @returns {Promise<Object>} 返回翻译结果 Promise
   */
  async baidu(q, from = 'auto', to = 'zh') {
    const baiduTranslation = new BaiduTranslation(this.options);
    return await  baiduTranslation.send(q, from, to);
  }

  /**
   * 使用有道翻译进行文本翻译
   * @param {string} q 要翻译的文本
   * @param {string} [from='auto'] 源语言，默认为自动识别
   * @param {string} [to='zh-CHS'] 目标语言，默认为简体中文
   * @returns {Promise<Object>} 返回翻译结果 Promise
   */
  async youdao(q, from = 'auto', to = 'zh-CHS') {
    const appid = this.options.youdaoOcrAppID;
    const appkey = this.options.youdaoOcrAppKey;
    const youdaoTranslation = new YoudaoTranslation(appid, appkey);
    return youdaoTranslation.submit(q, from, to);
  }

  /**
   * 使用讯飞翻译进行文本翻译
   * @param {string} q 要翻译的文本
   * @param {string} [from='en'] 源语言，默认为英文
   * @param {string} [to='cn'] 目标语言，默认为中文
   * @returns {Promise<Object>} 返回翻译结果 Promise
   */
  async xunfei(q, from = 'en', to = 'cn') {
    const APPId = this.options.xunfeiOcrAPPId;
    const APISecret = this.options.xunfeiOcrAPISecret;
    const APIKey = this.options.xunfeiOcrAPIKey;
    const xunfeiTranslation = new XunfeiTranslation(APPId, APISecret, APIKey);
    return xunfeiTranslation.submit(q, from, to);
  }

  /**
   * 使用腾讯翻译进行文本翻译
   * @param {string} q 要翻译的文本
   * @param {string} [from='auto'] 源语言，默认为自动识别
   * @param {string} [to='zh'] 目标语言，默认为中文
   * @returns {Promise<Object>} 返回翻译结果 Promise，使用与百度翻译相同的格式
   */
  tencent(q, from = 'auto', to = 'zh') {
    // 腾讯翻译 API 配置信息
    const clientConfig = {
      credential: {
        secretId: this.options.tencentOcrSecretID,
        secretKey: this.options.tencentOcrSecretKey
      },
      region: this.options.tencentOcrRegionSelected
    };

    const client = new TmtClient(clientConfig);
    // 去除原文内容的空行
    q = q.replace(/^\s*[\r\n]/gm, '');
    // 要发送的内容
    const params = {
      SourceText: q,
      Source: from,
      Target: to,
      ProjectId: 0
    };

    // 发送翻译
    return new Promise(resolve => {
      client.TextTranslate(params).then(result => {
        // 使用和百度相同的格式返回翻译结果
        const returnResult = {
          from: result.Source,
          to: result.Target,
          trans_result: []
        };
        // 把原文和译文拆分为数组
        const src = q.split("\n");
        const dst = result.TargetText.split("\n");
        // 把原文和译文加入翻译结果
        for (let i = 0;i < dst.length;i ++) {
          returnResult.trans_result.push({
            src: src[i],
            dst: dst[i]
          });
        }

        resolve({result: 'success', data: returnResult});
      }).catch(error => {
        resolve({result: 'error', msg: error.message});
      })
    });
  }
}