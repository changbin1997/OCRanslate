const {dialog, BrowserWindow} = require('electron');
const DateTime = require('./Datetime');
const fs = require('fs');
const path = require('path');

module.exports = class ExportResult {
  /**
   * 导出 OCR 识别结果为 HTML 文件
   * @param {Object} result OCR 识别结果对象，包含 img 和 text
   * @returns {boolean} 返回导出是否成功
   */
  ocrResultHTML(result) {
    // 生成默认的文件名
    const defaultFileName = `OCR${DateTime.timestampFormat2(
      'y-m-d-h-i-s',
      DateTime.timestamp()
    )}.html`;

    // 读取模板
    let html = '';
    try {
      html = fs.readFileSync(
        path.normalize(path.join(__dirname, '../templates/ocr-result.html')),
        'utf-8'
      );
    } catch (error) {
      dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
        type: 'error',
        message: '无法读取 HTML 模板文件！',
        buttons: ['关闭'],
        defaultId: 0,
        title: '出错了',
        noLink: true
      });
      return false;
    }

    // 传过来的图片 src 是否是 base64
    if (!/base64/.test(result.img)) {
      // 获取图片后缀
      const imgType = path.extname(result.img).replace('.', '');
      // 把图片转为 base64
      try {
        result.img = fs.readFileSync(result.img).toString('base64');
        result.img = `data:image/${imgType};base64,${result.img}`;
      } catch (error) {
        result.img = '';
        dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
          type: 'error',
          message: '无法获取识别图片，导出的 HTML 可能不包含图片！',
          buttons: ['关闭'],
          defaultId: 0,
          title: '出错了',
          noLink: true
        });
      }
    }

    // 生成和替换模板
    html = html.replace('{{title}}', defaultFileName).replace('{{img}}', result.img);
    const textArr = result.text.split('\n');
    let text = '';
    textArr.forEach(val => {
      text += `<p>${val}</p>`;
    });
    html = html.replace('{{text}}', text);

    // 显示文件保存对话框
    const fileName = dialog.showSaveDialogSync(BrowserWindow.getFocusedWindow(), {
      title: '导出位置选择',
      buttonLabel: '导出',
      defaultPath: path.join(process.cwd(), defaultFileName)
    });
    if (fileName === undefined) return false;

    // 保存文件
    fs.writeFile(fileName, html, 'utf-8', error => {
      if (error) {
        dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
          type: 'error',
          message: '导出文件出错，请检查导出目录是否有写入权限和足够的存储空间！',
          buttons: ['关闭'],
          defaultId: 0,
          title: '出错了',
          noLink: true
        });
      }
    });
  }

  /**
   * 导出 OCR 识别结果为 TXT 文件
   * @param {Object} result OCR 识别结果对象，包含 text
   * @returns {boolean} 返回导出是否成功
   */
  ocrResultTxt(result) {
    // 生成默认的文件名
    const defaultFileName = `OCR${DateTime.timestampFormat2(
      'y-m-d-h-i-s',
      DateTime.timestamp()
    )}.txt`;

    // 显示文件保存对话框
    const fileName = dialog.showSaveDialogSync(BrowserWindow.getFocusedWindow(), {
      title: '导出位置选择',
      buttonLabel: '导出',
      defaultPath: path.join(process.cwd(), defaultFileName)
    });
    if (fileName === undefined) return false;

    // 保存文件
    fs.writeFile(fileName, result.text, 'utf-8', error => {
      if (error) {
        dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
          type: 'error',
          message: '导出文件出错，请检查导出目录是否有写入权限和足够的存储空间！',
          buttons: ['关闭'],
          defaultId: 0,
          title: '出错了',
          noLink: true
        });
      }
    });
  }

  /**
   * 导出翻译结果为 HTML 文件
   * @param {Object} result 翻译结果对象，包含 from、to、trans_result
   * @returns {boolean} 返回导出是否成功
   */
  translationResultHTML(result) {
    // 生成默认的文件名
    const defaultFileName = `翻译${DateTime.timestampFormat2(
      'y-m-d-h-i-s',
      DateTime.timestamp()
    )}.html`;

    // 读取模板
    let html = '';
    try {
      html = fs.readFileSync(
        path.normalize(path.join(__dirname, '../templates/translation-result.html')),
        'utf-8'
      );
    } catch (error) {
      dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
        type: 'error',
        message: '无法读取 HTML 模板文件！',
        buttons: ['关闭'],
        defaultId: 0,
        title: '出错了',
        noLink: true
      });
      return false;
    }

    // 生成模板内容
    html = html
      .replace('{{title}}', defaultFileName)
      .replace('{{from}}', result.from)
      .replace('{{to}}', result.to);
    let src = '';
    let dst = '';
    result.trans_result.forEach(val => {
      src += `<p>${val.src}</p>`;
      dst += `<p>${val.dst}</p>`;
    });
    html = html.replace('{{src}}', src).replace('{{dst}}', dst);

    // 显示文件保存对话框
    const fileName = dialog.showSaveDialogSync(BrowserWindow.getFocusedWindow(), {
      title: '导出位置选择',
      buttonLabel: '导出',
      defaultPath: path.join(process.cwd(), defaultFileName)
    });
    if (fileName === undefined) return false;

    // 保存文件
    fs.writeFile(fileName, html, 'utf-8', error => {
      if (error) {
        dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
          type: 'error',
          message: '导出文件出错，请检查导出目录是否有写入权限和足够的存储空间！',
          buttons: ['关闭'],
          defaultId: 0,
          title: '出错了',
          noLink: true
        });
      }
    });
  }

  /**
   * 导出翻译结果为 TXT 文件
   * @param {Object} result 翻译结果对象，包含 from、to、trans_result
   * @returns {boolean} 返回导出是否成功
   */
  translationResultTxt(result) {
    // 生成默认的文件名
    const defaultFileName = `翻译${DateTime.timestampFormat2(
      'y-m-d-h-i-s',
      DateTime.timestamp()
    )}.txt`;

    // 显示文件保存对话框
    const fileName = dialog.showSaveDialogSync(BrowserWindow.getFocusedWindow(), {
      title: '导出位置选择',
      buttonLabel: '导出',
      defaultPath: path.join(process.cwd(), defaultFileName)
    });
    if (fileName === undefined) return false;

    // 要导出的内容
    let resultContent = '原文 ' + result.from;
    const src = [];
    const dst = [];
    result.trans_result.forEach(val => {
      src.push(val.src);
      dst.push(val.dst);
    });
    resultContent += '\n' + src.join('\n');
    resultContent += '\n\n译文 ' + result.to;
    resultContent += '\n' + dst.join('\n');

    // 保存文件
    fs.writeFile(fileName, resultContent, 'utf-8', error => {
      if (error) {
        dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
          type: 'error',
          message: '导出文件出错，请检查导出目录是否有写入权限和足够的存储空间！',
          buttons: ['关闭'],
          defaultId: 0,
          title: '出错了',
          noLink: true
        });
      }
    });
  }
};