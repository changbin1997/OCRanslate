const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');
const fetch = require('node-fetch');
const {app, shell} = require('electron');

// Node.js 16 / Electron 19 兼容：ppu-paddle-ocr 依赖全局 fetch 与 AbortSignal.timeout（Node 18+ 才有）
if (typeof globalThis.fetch !== 'function') {
  globalThis.fetch = fetch;
}
if (typeof AbortSignal.timeout !== 'function') {
  AbortSignal.timeout = (ms) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort(new Error(`The operation was aborted due to timeout (${ms} ms)`));
    }, ms);
    if (typeof timer.unref === 'function') timer.unref();
    return controller.signal;
  };
}

// 模型文件列表
const MODEL_FILES = {
  detection: 'PP-OCRv6_tiny_det.ort',
  recognition: 'PP-OCRv6_tiny_rec.ort',
  charactersDictionary: 'ppocrv6_tiny_dict.txt'
};

let servicePromise = null; // PaddleOcrService 初始化 Promise

/**
 * 获取 ppu-paddle-ocr 包入口文件的 URL
 * Electron 的 ESM 加载器不支持从 app.asar 内解析包，打包后需要加载 app.asar.unpacked 中的文件
 * @returns {string} 返回 ppu-paddle-ocr 入口文件 index.js 的 file URL
 */
function paddleOcrEntryUrl() {
  let entryPath;
  if (typeof app !== 'undefined' && app.isPackaged) {
    // 打包后 node_modules 被 asarUnpack 到 app.asar.unpacked
    entryPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ppu-paddle-ocr', 'index.js');
  } else {
    // 开发模式直接使用项目目录下的 node_modules
    entryPath = path.join(process.cwd(), 'node_modules', 'ppu-paddle-ocr', 'index.js');
  }
  return pathToFileURL(entryPath).href;
}

/**
 * 初始化并获取 PaddleOcrService 单例
 * @returns {Promise<Object>} 返回初始化完成的 PaddleOcrService
 */
async function getService() {
  if (servicePromise === null) {
    servicePromise = (async () => {
      const { PaddleOcrService } = await import(paddleOcrEntryUrl());
      const service = new PaddleOcrService({
        model: {
          detection: path.join(process.cwd(), 'paddleocr', MODEL_FILES.detection),
          recognition: path.join(process.cwd(), 'paddleocr', MODEL_FILES.recognition),
          charactersDictionary: path.join(process.cwd(), 'paddleocr', MODEL_FILES.charactersDictionary)
        }
      });
      await service.initialize();
      return service;
    })().catch((error) => {
      // 初始化失败时重置，允许下次重新尝试
      servicePromise = null;
      throw error;
    });
  }
  return servicePromise;
}

module.exports = class PaddleOcr {
  /**
   * 打开模型文件目录
   * @returns {{result: string, msg?: string}} 返回 {result, msg} 对象，result 为 'success' 或 'error'
   */
  openDir() {
    const dir = path.join(process.cwd(), 'paddleocr');
    // 目录是否存在
    if (!fs.existsSync(dir)) {
      // 如果目录不存在就创建一个
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (error) {
        return {result: 'error', msg: error.message};
      }
    }
    shell.openPath(dir);
    return {result: 'success'};
  }

  /**
   * 检查模型文件是否存在
   * @returns {boolean} 返回模型文件是否都存在
   */
  fileExists() {
    for (const fileName of Object.values(MODEL_FILES)) {
      if (!fs.existsSync(path.join(process.cwd(), 'paddleocr', fileName))) {
        return false;
      }
    }
    return true;
  }

  /**
   * 获取缺失的模型文件名列表
   * @returns {string[]} 返回缺失的模型文件名数组
   */
  missingFiles() {
    const missing = [];
    for (const fileName of Object.values(MODEL_FILES)) {
      if (!fs.existsSync(path.join(process.cwd(), 'paddleocr', fileName))) {
        missing.push(fileName);
      }
    }
    return missing;
  }

  /**
   * 使用 PaddleOCR 识别图片中的文字
   * @param {string} img 图片的 base64 数据或 data URL
   * @returns {Promise<{result: string, list?: string[], msg?: string}>} 返回 {result, list/msg} 对象，成功时 result 为 'success' 并包含识别出的文字列表
   */
  async recognize(img) {
    // 模型文件是否存在
    const missing = this.missingFiles();
    if (missing.length > 0) {
      return {result: 'error', msg: `缺少 PaddleOCR 模型文件：${missing.join('、')}`};
    }

    try {
      const service = await getService();
      // 兼容 data URL，提取实际的图片数据
      const imageData = img.replace(/^data:image\/[a-zA-Z+.-]+;base64,/, '');
      if (imageData === '') return {result: 'error', msg: '图片数据无效'};
      const buffer = Buffer.from(imageData, 'base64');
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      const result = await service.recognize(arrayBuffer);
      // 把识别结果按行拆分为数组
      const list = result.text.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
      return {result: 'success', list: list};
    } catch (error) {
      return {result: 'error', msg: error.message};
    }
  }
};