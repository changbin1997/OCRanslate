const {dialog, ipcMain, BrowserWindow, clipboard, shell, app, globalShortcut, Tray, Menu} = require('electron');
const Ocr = require('./Ocr');  // OCR 模块
const Data = require('./Data');  // 数据库操作模块
const ContextMenu = require('./contextMenu');  // 上下文菜单模块
const Translation = require('./Translation');  // 翻译模块
const TesseractOcr = require('./TesseractOcr');
const selectorWindow = require('./selector-window');
const ScreenshotOcr = require('./screenshotOcr');
const path = require("path");
let disabled = false; // 用于禁用截图识别
let tray = null;  // 用来存储系统托盘

module.exports = class MyApp {
  data = null;
  options = null;

  /**
   * 初始化数据库和获取配置选项
   * @param {Object} mainWindow Electron 主窗口对象
   * @returns {Promise<void>}
   */
  async dataInit(mainWindow) {
    this.data = new Data();
    // 如果无法打开数据库
    if (this.data.dbErr !== null) {
      await dialog.showMessageBox(mainWindow, {
        title: '无法初始化数据库',
        message: '无法打开和初始化数据库，程序无法正常运行！',
        type: 'error',
        buttons: ['退出程序'],
        noLink: true
      });
      // 退出软件
      app.quit();
    }

    // 数据库初始化
    const initResult = await this.data.init();
    // 出错
    if (initResult.result !== 'success') {
      await dialog.showMessageBox(mainWindow, {
        title: '数据库初始化错误',
        message: initResult.msg,
        type: 'error',
        buttons: ['退出程序'],
        noLink: true
      });
      // 退出软件
      app.quit();
    }

    // 获取设置
    this.options = await this.data.getOptions();
    // 出错
    if (this.options.result !== 'success') {
      await dialog.showMessageBox(mainWindow, {
        title: '查询数据出错！',
        message: this.options.msg,
        type: 'error',
        buttons: ['退出程序'],
        noLink: true
      });
      // 退出软件
      app.quit();
    }
  }

  /**
   * 创建系统托盘菜单
   * @param {Object} mainWindow Electron 主窗口对象
   * @returns {Promise<void>}
   */
  async trayMenu(mainWindow) {
    tray = new Tray(path.normalize(path.join(__dirname, '../icon.ico')));
    // 菜单模板
    const trayMenu = [
      {
        label: '显示主窗口',
        click: () => {
          if (mainWindow.isVisible()) return false;
          mainWindow.show();
        }
      },
      {
        label: '设置',
        click: () => {
          mainWindow.webContents.send('toPage', 'optionsPage');
          if (!mainWindow.isVisible()) mainWindow.show();
        }
      },
      {
        label: '退出',
        role: 'quit'
      }
    ];
    // 创建菜单
    tray.setContextMenu(Menu.buildFromTemplate(trayMenu));
    // 托盘图标设置提示文字
    tray.setToolTip(`OCR识别翻译\n${this.options.options.key1Name}：${this.options.options.key1Function}\n${this.options.options.key2Name}：${this.options.options.key2Function}`);
    // 托盘图标点击
    tray.on('click', () => {
      if (mainWindow.isVisible()) return false;
      mainWindow.show();
    });
  }

  /**
   * 注册全局快捷键和监听快捷键事件
   * @param {Object} mainWindow Electron 主窗口对象
   * @returns {Promise<void>}
   */
  async globalShortcut(mainWindow) {
    const screenshotOcr = new ScreenshotOcr(this.options.options);
    // 如果开启了全局快捷键1
    if (this.options.options.key1Enable) {
      // 快捷键1事件
      globalShortcut.register(this.options.options.key1Name, async () => {
        if (disabled) {
          // 播放提示音
          shell.beep();
          return false;
        }
        disabled = true; // 正在识别时禁用截图
        const result = await screenshotOcr.ocr(
          this.options.options.key1Provider,
          this.options.options.key1Function
        );
        disabled = false; // 识别完成后恢复截图
        // 取消截图
        if (result === null) return false;
        if (result.result !== 'success') {
          await dialog.showMessageBox(mainWindow, {
            title:'OCR 识别出错',
            message: result.msg,
            type: 'error',
            buttons: ['关闭'],
            noLink: true
          });
          return false;
        }
        result.auto = this.options.options.key1Auto;
        mainWindow.webContents.send('ocrResult', result);
      });
    }

    // 如果开启了全局快捷键2
    if (this.options.options.key2Enable) {
      // 快捷键2事件
      globalShortcut.register(this.options.options.key2Name, async () => {
        if (disabled) {
          // 播放提示音
          shell.beep();
          return false;
        }
        disabled = true; // 正在识别时禁用截图
        const result = await screenshotOcr.ocr(
          this.options.options.key2Provider,
          this.options.options.key2Function
        );
        disabled = false; // 识别完成后恢复截图
        // 取消截图
        if (result === null) return false;
        if (result.result !== 'success') {
          await dialog.showMessageBox(mainWindow, {
            title: 'OCR 识别出错',
            message: result.msg,
            type: 'error',
            buttons: ['关闭'],
            noLink: true
          });
          return false;
        }
        result.auto = this.options.options.key2Auto;
        mainWindow.webContents.send('ocrResult', result);
      });
    }

    // 如果开启了指定区域识别
    if (this.options.options.specificArea) {
      globalShortcut.register(this.options.options.specificAreaKeyName, async () => {
        if (disabled) {
          // 播放提示音
          shell.beep();
          return false;
        }
        disabled = true; // 正在识别时禁用截图
        // 调用截取指定区域识别
        const result = await screenshotOcr.specificArea(
          this.options.options.specificAreaProvider,
          this.options.options.specificAreaApi,
          this.options.options.specificAreaLeft,
          this.options.options.specificAreaTop,
          this.options.options.specificAreaWidth,
          this.options.options.specificAreaHeight
        );
        disabled = false; // 识别完成后恢复截图
        // 识别出错
        if (result.result !== 'success') {
          await dialog.showMessageBox(mainWindow, {
            title: 'OCR 识别出错',
            message: result.msg,
            type: 'error',
            buttons: ['关闭'],
            noLink: true
          });
          return false;
        }
        result.auto = this.options.options.specificAreaAuto;
        mainWindow.webContents.send('ocrResult', result);
      });
    }

    // 如果开启了剪贴板翻译
    if (this.options.options.clipboardTranslation) {
      globalShortcut.register(this.options.options.clipboardTranslationKeyName, () => {
        // 读取剪贴板的文字
        const clipboardText = clipboard.readText();
        if (clipboardText === '') return false;
        // 把剪贴板的内容传给渲染进程的 app 组件
        mainWindow.webContents.send('clipboardTranslation', clipboardText);
      });
    }
  }


  /**
   * 处理渲染进程的 IPC 请求和事件
   * @returns {void}
   */
  ipc() {
    // 打开屏幕区域选择窗口
    ipcMain.handle('selector-window',  async () => {
      return await selectorWindow();
    });

    // 重启程序
    ipcMain.handle('restart', () => {
      app.relaunch();
      app.exit();
    });

    // 显示对话框
    ipcMain.handle('dialog', async (ev, args) => {
      return dialog[args.name](BrowserWindow.getFocusedWindow(), args.options);
    });

    // 是否是图片文件
    ipcMain.handle('isImage',  (ev, args) => {
      return Ocr.isImage(args);
    });

    // 图片转 base64
    ipcMain.handle('fileToBase64', (ev, args) => {
      return Ocr.fileToBase64(args);
    });

    // OCR识别
    ipcMain.handle('ocr', async (ev, args) => {
      const ocr = new Ocr(args.options);
      if (args.provider === 'xunfei') {
        // 讯飞OCR
        return await ocr.xunfei(args.type, args.base64File, args.imgType);
      }else if (args.provider === 'tesseract') {
        // tesseractOCR
        return await ocr.tesseract(args.base64File);
      }else {
        return await ocr[args.provider](args.type, args.base64File);
      }
    });

    // 拷贝文本到剪贴板
    ipcMain.handle('copy-text', (ev, args) => {
      clipboard.writeText(args);
    });

    // 翻译
    ipcMain.handle('translation', async (ev, args) => {
      const translation = new Translation(args.options);
      return await translation.translation(args.q, args.from, args.to);
    });

    // 获取选项
    ipcMain.handle('getOptions', async () => {
      return this.options;
    });

    // 保存选项
    ipcMain.handle('updateOptions', async (ev, args) => {
      return await this.data.updateOptions(args);
    });

    // 获取 OCR 记录总览
    ipcMain.handle('ocrHistoryOverview', async () => {
      const baiduData = await this.data.getBaiduOcrHistoryOverview();
      const tencentData = await this.data.getTencentOcrHistoryOverview();
      const xunfeiData = await this.data.getXunfeiOcrHistoryOverview();
      const youdaoData = await this.data.getYoudaoOcrHistoryOverview();

      return {
        baidu: baiduData,
        tencent: tencentData,
        xunfei: xunfeiData,
        youdao: youdaoData
      };
    });

    // 获取 OCR 历史记录
    ipcMain.handle('ocrHistoryList',  async (ev, args) => {
      return await this.data.getOcrHistoryList(args.start, args.count);
    });

    // 获取翻译数据总览
    ipcMain.handle('translationHistoryOverview', async () => {
      return await this.data.getTranslationHistoryOverview();
    });

    // 获取翻译历史记录数据
    ipcMain.handle('translationHistoryList', async (ev, args) => {
      return await this.data.getTranslationHistoryList(args.start, args.count);
    });

    // 清空翻译历史记录
    ipcMain.handle('deleteAllTranslationHistory', async (ev, args) => {
      return await this.data.deleteAllTranslationHistory(args);
    });

    // 清空指定提供商的 OCR 历史记录
    ipcMain.handle('deleteOcrHistory', async (ev, args) => {
      return await this.data.deleteAllOcrHistory(args);
    });

    // 上下文菜单请求
    ipcMain.on('contextMenu', (ev, args) => {
      // 弹出上下文菜单
      ContextMenu.inputMenu(args.x, args.y);
    });

    // 导出翻译结果菜单请求
    ipcMain.on('exportTranslationMenu', (ev, args) => {
      // 弹出用于导出翻译结果的菜单
      ContextMenu.exportTranslationMenu(args.x, args.y, args.result);
    });

    // 导出 OCR 识别结果菜单请求
    ipcMain.on('exportOcrMenu', (ev, args) => {
      // 弹出用于导出翻译结果的菜单
      ContextMenu.exportOcrMenu(args.x, args.y, args.result);
    });

    // 通过浏览器打开链接地址
    ipcMain.on('openLink', (ev, args) => {
      shell.openExternal(args);
    });

    // 添加收藏
    ipcMain.handle('addToFavorites', async (ev, args) => {
      return await this.data.addToFavorites(args);
    });

    // 获取收藏
    ipcMain.handle('getFavorites', async (ev, args) => {
      return await this.data.getFavorites(args);
    });

    // 删除收藏
    ipcMain.handle('deleteFavorite', async (ev, args) => {
      return await this.data.deleteFavorite(args);
    });

    // 获取 TesseractOcr 的模型文件列表
    ipcMain.handle('getTesseractOcrFileList', () => {
      const tesseractOcr = new TesseractOcr();
      return tesseractOcr.fileList();
    });

    // 打开模型文件目录
    ipcMain.handle('openDir', () => {
      const tesseractOcr = new TesseractOcr();
      return tesseractOcr.openDir();
    });
  }
};