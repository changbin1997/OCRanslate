// aliyun-ocr.js
const axios = require("axios");
const crypto = require("crypto");

module.exports =  class AliyunOCR {

  /**
   * 构造函数
   * @param {string} accessKeyId - 阿里云 AccessKey ID
   * @param {string} accessKeySecret - 阿里云 AccessKey Secret
   * @param {string} [endpoint] - OCR API 的接入地址，默认为 "https://ocr-api.cn-hangzhou.aliyuncs.com"
   */
  constructor(accessKeyId, accessKeySecret, endpoint) {
    if (!accessKeyId || !accessKeySecret) {
      throw new Error("accessKeyId 和 accessKeySecret 必须提供");
    }
    this.accessKeyId = accessKeyId;
    this.accessKeySecret = accessKeySecret;
    this.endpoint = endpoint || "https://ocr-api.cn-hangzhou.aliyuncs.com";
    this.timeout = 15000; // 15s
  }

  
  /**
   * 对字符串进行 RFC 3986 编码
   * @param {string} str - 需要编码的字符串
   * @returns {string} 编码后的字符串
   * @private
   */
  _percentEncode(str) {
    return encodeURIComponent(str)
      .replace(/\+/g, "%20")
      .replace(/%2A/g, "%2A")
      .replace(/%7E/g, "~");
  }

  /**
   * 获取当前时间的 ISO 8601 格式字符串
   * @returns {string} ISO 8601 格式的时间字符串
   * @private
   */
  _nowISO8601() {
    return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  }

  /**
   * 生成一个 UUID
   * @returns {string} UUID
   * @private
   */
  _uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ (crypto.randomBytes(1)[0] & (15 >> (c / 4)))).toString(16)
    );
  }

  /**
   * 构建带有签名的请求 URL
   * @param {string} action - OCR 操作的名称，如 "RecognizeGeneral"
   * @param {object} [params={}] - 请求参数
   * @param {string} [method="GET"] - HTTP 请求方法
   * @returns {string} 构建好的带有签名的 URL
   * @private
   */
  _buildSignedUrl(action, params = {}, method = "GET") {
    const baseParams = {
      Format: "JSON",
      Version: "2021-07-07",
      AccessKeyId: this.accessKeyId,
      SignatureMethod: "HMAC-SHA1",
      SignatureVersion: "1.0",
      SignatureNonce: this._uuid(),
      Timestamp: this._nowISO8601(),
      Action: action
    };

    const all = Object.assign({}, baseParams, params);

    const keys = Object.keys(all)
      .filter(k => all[k] !== undefined && all[k] !== null && String(all[k]) !== "")
      .sort();

    const canonical = keys
      .map(k => `${this._percentEncode(k)}=${this._percentEncode(String(all[k]))}`)
      .join("&");

    const stringToSign = `${method.toUpperCase()}&${this._percentEncode("/")}&${this._percentEncode(canonical)}`;

    const signature = crypto
      .createHmac("sha1", this.accessKeySecret + "&")
      .update(stringToSign, "utf8")
      .digest("base64");

    const finalUrl = `${this.endpoint}/?${canonical}&Signature=${this._percentEncode(signature)}`;
    return finalUrl;
  }

  /**
   * 将 Base64 字符串转换为 Buffer
   * @param {string} base64str - Base64 编码的字符串
   * @returns {Buffer|{error: string}} 成功时返回 Buffer，失败时返回一个包含 error信息的对象
   * @private
   */
  _base64ToBuffer(base64str) {
    if (!base64str || typeof base64str !== "string") {
      return { error: "base64 必须是非空字符串" };
    }
    const cleaned = base64str.replace(/^data:.*;base64,/, "").trim();
    try {
      return Buffer.from(cleaned, "base64");
    } catch (e) {
      return { error: "base64 解码失败: " + e.message };
    }
  }

  /**
   * 格式化 OCR 原始响应
   * @param {object|string} raw - 阿里云 OCR API 的原始响应数据
   * @returns {{result: "success", list: string[]}|{result: "error", msg: string}} 格式化后的结果
   * @private
   */
  _formatOcrResponse(raw) {
    // 如果已经是我们定义的 error 格式，直接返回
    if (raw && raw.result === "error") return raw;

    // raw.Data 可能是 JSON 字符串或对象
    const dataField = raw && (raw.Data || raw.data);
    if (!dataField) {
      // 有些错误会出现在 raw 中
      return { result: "error", msg: "响应中未包含 Data 字段" };
    }

    let parsed;
    if (typeof dataField === "string") {
      try {
        parsed = JSON.parse(dataField);
      } catch (e) {
        // 如果解析失败但 dataField 本身是一段文本，尝试把它当作整段文本返回一行
        const trimmed = dataField.trim();
        if (trimmed.length > 0) {
          return { result: "success", list: [trimmed] };
        }
        return { result: "error", msg: "解析 Data JSON 失败: " + e.message };
      }
    } else if (typeof dataField === "object") {
      parsed = dataField;
    } else {
      return { result: "error", msg: "无法处理 Data 字段的类型" };
    }

    // 尝试从 parsed 中抽取按行的文本
    const lines = [];

    // 1) 优先 prism_wordsInfo（样例中使用）
    const tryArrays = [
      parsed.prism_wordsInfo,
      parsed.prismWordsInfo,
      parsed.prism_words_info,
      parsed.words,
      parsed.Words,
      parsed.wordsInfo,
      parsed.WordsInfo
    ];

    for (const arr of tryArrays) {
      if (Array.isArray(arr) && arr.length > 0) {
        for (const item of arr) {
          if (!item) continue;
          const text =
            (typeof item.word === "string" && item.word) ||
            (typeof item.text === "string" && item.text) ||
            (typeof item.Text === "string" && item.Text) ||
            (typeof item.Words === "string" && item.Words) ||
            (typeof item.words === "string" && item.words) ||
            (typeof item === "string" && item);
          if (text && String(text).trim()) lines.push(String(text).trim());
        }
        if (lines.length > 0) return { result: "success", list: lines };
      }
    }

    // 2) 如果有 content 字段（通常是整段文本），按换行切分
    if (parsed.content && typeof parsed.content === "string") {
      const arr = parsed.content.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      if (arr.length > 0) return { result: "success", list: arr };
      const trimmed = parsed.content.trim();
      if (trimmed.length > 0) return { result: "success", list: [trimmed] };
    }

    // 3) 有些接口会把识别结果放在 parsed.Text 或 parsed.text
    if (parsed.Text && typeof parsed.Text === "string") {
      const arr = parsed.Text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      if (arr.length > 0) return { result: "success", list: arr };
    }
    if (parsed.text && typeof parsed.text === "string") {
      const arr = parsed.text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      if (arr.length > 0) return { result: "success", list: arr };
    }

    // 4) 兜底：尝试将 parsed 中所有字符串字段拼接为若干行（不太优雅，但防止空结果）
    const candidateLines = [];
    (function collectStrings(obj) {
      if (!obj || typeof obj !== "object") return;
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (typeof v === "string" && v.trim()) candidateLines.push(v.trim());
        else if (Array.isArray(v)) {
          for (const it of v) {
            if (typeof it === "string" && it.trim()) candidateLines.push(it.trim());
            else if (it && typeof it === "object") collectStrings(it);
          }
        } else if (v && typeof v === "object") {
          collectStrings(v);
        }
      }
    })(parsed);

    if (candidateLines.length > 0) {
      // 去重并返回合理数量
      const uniq = Array.from(new Set(candidateLines)).slice(0, 200);
      return { result: "success", list: uniq };
    }

    // 都没有，则返回解析失败
    return { result: "error", msg: "无法从响应中提取到识别文本" };
  }

  /**
   * 发起 POST 二进制请求并格式化返回
   * @param {string} action - OCR 操作名称
   * @param {Buffer} buffer - 请求体中的二进制数据
   * @param {object} [extraParams={}] - 额外的请求参数
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 格式化后的 OCR 结果
   * @private
   */
  async _postBinary(action, buffer, extraParams = {}) {
    try {
      const url = this._buildSignedUrl(action, extraParams, "POST");
      const res = await axios.post(url, buffer, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": buffer.length
        },
        timeout: this.timeout,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      // res.data 里通常包含 RequestId 和 Data
      return this._formatOcrResponse(res.data);
    } catch (err) {
      let msg = err.message;
      if (err.response && err.response.data) {
        try {
          msg = typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data);
        } catch (e) {
          msg = String(err.response.data);
        }
      }
      return { result: "error", msg };
    }
  }

  /**
   * 通过图片 URL 进行 OCR 识别
   * @param {string} action - OCR 操作名称
   * @param {string} imageUrl - 图片的公开 URL 地址
   * @param {object} [extraParams={}] - 额外的请求参数
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 格式化后的 OCR 结果
   */
  async requestByUrl(action, imageUrl, extraParams = {}) {
    if (!imageUrl || typeof imageUrl !== "string") {
      return { result: "error", msg: "imageUrl 必须是字符串" };
    }
    try {
      const url = this._buildSignedUrl(action, Object.assign({ Url: imageUrl }, extraParams), "GET");
      const res = await axios.get(url, { timeout: this.timeout });
      return this._formatOcrResponse(res.data);
    } catch (err) {
      let msg = err.message;
      if (err.response && err.response.data) {
        try {
          msg = typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data);
        } catch (e) {
          msg = String(err.response.data);
        }
      }
      return { result: "error", msg };
    }
  }

  /**
   * 通用文字识别
   * @param {string} base64str - 图片的 Base64 编码字符串
   * @param {object} [extraParams={}] - 额外的请求参数
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 格式化后的 OCR 结果
   */
  async recognizeGeneral(base64str, extraParams = {}) {
    const bufOrErr = this._base64ToBuffer(base64str);
    if (bufOrErr && bufOrErr.error) {
      return { result: "error", msg: bufOrErr.error };
    }
    return await this._postBinary("RecognizeGeneral", bufOrErr, extraParams);
  }

  /**
   * 高精度文字识别
   * @param {string} base64str - 图片的 Base64 编码字符串
   * @param {object} [extraParams={}] - 额外的请求参数
   * @returns {Promise<{result: "success", list: string[]}|{result: "error", msg: string}>} 格式化后的 OCR 结果
   */
  async recognizeAdvanced(base64str, extraParams = {}) {
    const bufOrErr = this._base64ToBuffer(base64str);
    if (bufOrErr && bufOrErr.error) {
      return { result: "error", msg: bufOrErr.error };
    }
    return await this._postBinary("RecognizeAdvanced", bufOrErr, extraParams);
  }
}
