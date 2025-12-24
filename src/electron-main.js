const { app, BrowserWindow, globalShortcut, Menu } = require('electron');
const path = require('path');
const MyApp = require('./modules/MyApp');

let mainWindow; // 用来保存主窗口对象的引用
const myApp = new MyApp();

// 当 Electron 完成初始化并准备创建浏览器窗口时被调用
app.on('ready', async () => {
  // 创建主窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 720,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      textAreasAreResizable: false,
      spellcheck: false,
      webSecurity: false
    }
  });

  // 隐藏菜单栏
  if (app.isPackaged) {
    Menu.setApplicationMenu(null);
  }

  // 关闭事件
  mainWindow.on('closed', () => {
    globalShortcut.unregisterAll();
    mainWindow = null;
  });

  // 窗口最小化
  mainWindow.on('minimize', () => {
    mainWindow.hide();
  });

  // 初始化数据库
  await myApp.dataInit(mainWindow);

  // 加载页面文件
  if (app.isPackaged) {
    // 如果是打包好的就加载打包的 HTML 文件
    mainWindow.loadFile('dist/index.html');
  } else {
    // 如果没有打包就直接从本地服务器加载
    mainWindow.loadURL('http://localhost:38527/');
  }

  // 全局快捷键
  await myApp.globalShortcut(mainWindow);

  // 托盘图标菜单
  await myApp.trayMenu(mainWindow);
});

// 处理 ipc 请求
myApp.ipc();