const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const ocrLanguageList = require('./ocr-language-list');
const shell = require('electron').shell;

module.exports = class TesseractOcr {
  /**
   * 打开模型文件目录
   * @returns {Object} 返回 {result, msg} 对象，result 为 'success' 或 'error'
   */
  openDir() {
    const dir = path.join(process.cwd(), 'tessdata');
    // 目录是否存在
    if (!fs.existsSync(dir)) {
      // 如果目录不存在就创建一个
      try {
        fs.mkdirSync(dir, { recursive: true });
      }catch (error) {
        return {result: 'error', msg: error.message};
      }
    }
    shell.openPath(dir);
    return {result: 'success'};
  }

  /**
   * 获取模型文件列表
   * @returns {Object} 返回 {list, count} 对象，list 为文件列表数组，count 为已下载文件数量
   */
  fileList() {
    // 获取文件列表
    const list = fs.readdirSync(path.join(process.cwd(), 'tessdata'));
    if (list.length < 1) return {list: [], count: 0};

    const languageList = ocrLanguageList.tesseract;
    let count = 0;  // 记录已下载的文件数量
    for (let i = 0;i < languageList.length;i ++) {
      if (list.includes(languageList[i].file)) {
        languageList[i].exists = '已下载';
        count ++;
      }else {
        languageList[i].exists = '未下载';
      }
    }

    return {list: languageList, count: count};
  }

  /**
   * 检查模型文件是否存在
   * @param {string} fileName 模型文件名称
   * @returns {boolean} 返回文件是否存在
   */
  fileExists(fileName) {
    fileName = path.join(process.cwd(), 'tessdata', fileName);
    return fs.existsSync(fileName);
  }

  /**
   * 使用 Tesseract 识别图片中的文字
   * @param {string} img 图片路径或数据
   * @param {string} [language='chi_sim'] 识别语言，默认为简体中文
   * @returns {Promise<Object>} 返回 {result, list/msg} 对象的 Promise，成功时包含识别出的文字列表
   */
  async recognize(img, language = 'chi_sim') {
    // 是否是支持的语言
    const languageItem = ocrLanguageList.tesseract.find(item => item.code === language);
    if (languageItem === undefined) return {result: 'error', msg: `不支持的语言 ${language}`};

    // 语言模型是否存在
    if (!this.fileExists(languageItem.file)) {
      return {result: 'error', msg: `缺少 ${languageItem.name} 的语言模型，请下载 ${languageItem.file}！`};
    }

    try {
      const result = await Tesseract.recognize(img, language, {
        langPath: path.join(process.cwd(), 'tessdata'),
        cacheMethod: 'none',
        gzip: false,
        tessedit_ocr_engine_mode: 1,
        user_defined_dpi: 300,
        tessedit_pageseg_mode: 3
      });

      // 如果是中文就去除中文之间的单词空格
      if (language === 'chi_sim' || language === 'chi_tra') {
        const lines = result.data.text.split('\n');
        // 处理每一行
        const cleanedLines = lines.map((line) => {
          // 如果整行没有英文，直接去掉所有空格
          if (!/[a-zA-Z]/.test(line)) {
            return line.replace(/\s+/g, '');
          }
          // 只去掉中文之间的空格，保留英文的空格
          return line.replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2');
        });
        return {result: 'success', list: cleanedLines};
      }else {
        return {result: 'success', list: result.data.text.split('\n')};
      }
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }
}