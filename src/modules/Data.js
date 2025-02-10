const sqlite3 = require('sqlite3');
const path = require('path');
const Datetime = require('./Datetime');

module.exports = class Data {
  db = null;
  dbErr = null;

  constructor() {
    const dbName = path.join(process.cwd(), 'data.db'); // 数据库名
    // 打开数据库
    this.db = new sqlite3.Database(dbName, err => {
      if (err !== null) {
        this.dbErr = err;
      }
    });
  }

  // 删除翻译收藏
  deleteFavorite(id) {
    const sql = 'DELETE FROM favorites WHERE id = ?';
    return new Promise(resolve => {
      this.db.run(sql, [id], function (err) {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        resolve({ result: 'success', count: this.changes });
      });
    });
  }

  // 获取翻译收藏数量
  favoritesCount() {
    const sql = 'SELECT COUNT(*) AS count FROM favorites';
    return new Promise(resolve => {
      this.db.get(sql, (err, row) => {
        if (err) {
          resolve(0);
        }else {
          resolve(row.count);
        }
      });
    });
  }

  // 获取翻译收藏
  async getFavorites(page) {
    // 获取收藏数量
    const count = await this.favoritesCount();
    if (count < 1) return {result: 'success', list: [], count: 0};

    const sql = `
    SELECT id, language1 AS 'from', language2 AS 'to', src, dst, created, provider FROM favorites
    ORDER BY created DESC
    LIMIT ?, ?
    `;

    return new Promise(resolve => {
      this.db.all(sql, [page, 10], (err, rows) => {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        // 时间戳格式化
        for (let i = 0; i < rows.length; i++) {
          rows[i].created = Datetime.timestampFormat(rows[i].created);
        }

        resolve({ result: 'success', count: count, list: rows });
      });
    });
  }

  // 添加翻译收藏
  addToFavorites(result) {
    // 获取当前的时间戳
    const timestamp = Datetime.timestamp();

    // 获取原文和译文
    const src = [];
    const dst = [];
    result.trans_result.forEach(val => {
      src.push(val.src);
      dst.push(val.dst);
    });

    const sql = `
    INSERT INTO favorites
    (language1, language2, src, dst, created, provider)
    VALUES
    (?, ?, ?, ?, ?, ?)
    `;
    // 用于替换 SQL 占位符的数据
    const value = [result.from, result.to, src.join('\n'), dst.join('\n'), timestamp, result.provider];

    return new Promise(resolve => {
      this.db.run(sql, value, function (err) {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        resolve({ result: 'success', count: this.changes, id: this.lastID });
      });
    });
  }

  // 保存选项
  async updateOptions(options) {
    // 获取选项名
    const optionsName = Object.keys(options);
    let value = ''; // 用来存储选项值
    let count = 0; // 用来存储更改的行数

    for (let i = 0; i < optionsName.length; i++) {
      // 把 Number 类型的值转为 String
      if (typeof options[optionsName[i]] === 'number') {
        value = String(options[optionsName[i]]);
      }
      // 把 Boolean 类型的值转为 String
      if (typeof options[optionsName[i]] === 'boolean') {
        value = String(Number(options[optionsName[i]]));
      }
      // String 类型的值就直接传给 value
      if (typeof options[optionsName[i]] === 'string') {
        value = options[optionsName[i]];
      }
      // 更新数据
      const result = await this.updateOptionsData(optionsName[i], value);
      if (result.result !== 'success') return result;
      count += result.count;
    }

    return { result: 'success', count: count };
  }

  // 保存选项数据
  updateOptionsData(name, value) {
    const sql = 'UPDATE ocr_options SET value = ? WHERE name = ?';
    return new Promise(resolve => {
      this.db.run(sql, [value, name], function (err) {
        if (err) {
          resolve({ result: 'error', msg: err.message });
        } else {
          resolve({ result: 'success', count: this.changes });
        }
      });
    });
  }

  // 获取选项
  getOptions() {
    return new Promise(resolve => {
      this.db.all('SELECT name, value FROM ocr_options', (err, rows) => {
        if (err) {
          this.dbErr = err;
          resolve({ result: 'error', msg: err.message });
          return false;
        }

        const options = {}; // 用来存储转换后的选项
        rows.forEach(item => {
          // 把选项名和选项值传给 options
          options[item.name] = item.value;
        });
        // 把 Boolean 类型的选项值转为 Boolean
        options.keyF1Enable = Boolean(Number(options.keyF1Enable));
        options.keyF2Enable = Boolean(Number(options.keyF2Enable));
        options.ocrAutoVoice = Boolean(Number(options.ocrAutoVoice));
        options.translationAutoVoice = Boolean(Number(options.translationAutoVoice));
        options.autoTranslation = Boolean(Number(options.autoTranslation));
        options.specificArea = Boolean(Number(options.specificArea));
        options.clipboardTranslation = Boolean(Number(options.clipboardTranslation));
        // 把 Number 类型的值转为 Number
        options.ocrVoiceSpeed = Number(options.ocrVoiceSpeed);
        options.ocrVoiceVolume = Number(options.ocrVoiceVolume);
        options.translationVoiceVolume = Number(options.translationVoiceVolume);
        options.translationVoiceSpeed = Number(options.translationVoiceSpeed);
        options.specificAreaLeft = Number(options.specificAreaLeft);
        options.specificAreaTop = Number(options.specificAreaTop);
        options.specificAreaWidth = Number(options.specificAreaWidth);
        options.specificAreaHeight = Number(options.specificAreaHeight);
        resolve({ result: 'success', options: options });
      });
    });
  }

  // 初始化
  async init() {
    // 检查选项数据表是否存在
    const optionsTable = await this.optionsTableExists();
    if (optionsTable.result !== 'success') return optionsTable;
    // 如果不存在就创建数据表
    if (optionsTable.count < 1) {
      const createTable = await this.createOptionsTable();
      // 创建失败
      if (createTable.result !== 'success') return createTable;
      if (createTable.count < 1) return { result: 'error', msg: '无法创建选项数据表！' };
      // 创建成功就写入默认选项数据
      const insertData = await this.insertOptions();
      if (insertData.result !== 'success') return insertData;
      if (insertData.count < 27) return { result: 'error', msg: '无法写入默认选项数据！' };
    }

    // 检查 OCR 历史记录数据表是否存在
    const ocrTable = await this.ocrHistoryTableExists();
    if (ocrTable.result !== 'success') return ocrTable;
    // 不存在就创建
    if (ocrTable.count < 1) {
      const createTable = await this.createOcrHistoryTable();
      // 创建失败
      if (createTable.result !== 'success') return createTable;
      if (createTable.count < 1) return { result: 'error', msg: '无法创建 OCR 记录数据表！' };
    }

    // 检查翻译历史记录数据表是否存在
    const translationTable = await this.translationHistoryTableExists();
    if (translationTable.result !== 'success') return translationTable;
    // 不存在就创建
    if (translationTable.count < 1) {
      const createTable = await this.createTranslationHistoryTable();
      // 创建失败
      if (createTable.result !== 'success') return createTable;
      if (createTable.count < 1) return { result: 'error', msg: '无法创建翻译记录数据表！' };
    }

    // 检查收藏数据表是否存在
    const favoritesTable = await this.favoritesTableExists();
    if (favoritesTable.result !== 'success') return favoritesTable;
    // 不存在就创建
    if (favoritesTable.count < 1) {
      const createTable = this.createFavoritesTable();
      // 创建失败
      if (createTable.result !== 'success') return createTable;
      if (createTable.count < 1) return { result: 'error', msg: '无法创建收藏数据表！' };
    }

    return { result: 'success' };
  }

  // 写入默认选项
  insertOptions() {
    // 默认选项
    const options = {
      tesseractOcrLanguageSelected: 'chi_sim',
      youdaoOcrAppID: '',
      youdaoOcrAppKey: '',
      youdaoOcrLanguageSelected: 'auto',
      xunfeiOcrAPPId: '',
      xunfeiOcrAPISecret: '',
      xunfeiOcrAPIKey: '',
      baiduOcrAppID: '',
      baiduOcrApiKey: '',
      baiduOcrSecretKey: '',
      baiduOcrLanguageSelected: 'CHN_ENG',
      tencentOcrAppID: '',
      tencentOcrSecretID: '',
      tencentOcrSecretKey: '',
      tencentOcrLanguageSelected: 'zh_rare',
      tencentOcrRegionSelected: 'ap-shanghai',
      baiduTranslationAppID: '',
      baiduTranslationApiKey: '',
      translationProvider: 'baidu',
      ocrVoiceSpeed: 2,
      ocrVoiceVolume: 10,
      ocrVoiceLibrarySelected: '',
      translationVoiceVolume: 10,
      translationVoiceSpeed: 2,
      translationVoiceLibrarySelected: 'auto',
      key1Enable: false,
      key1Function: '百度云通用文字识别（标准版）',
      key1Provider: 'baidu',
      key1Auto: '无',
      key1Name: 'F1',
      key2Enable: false,
      key2Function: '腾讯云通用印刷体识别',
      key2Provider: 'tencent',
      key2Auto: '无',
      key2Name: 'F2',
      specificArea: false,
      specificAreaKeyName: 'F3',
      specificAreaLeft: 0,
      specificAreaTop: 0,
      specificAreaWidth: 300,
      specificAreaHeight: 300,
      specificAreaApi: '腾讯云通用印刷体识别',
      specificAreaProvider: 'tencent',
      specificAreaAuto: '无',
      ocrAutoVoice: false,
      translationAutoVoice: false,
      autoTranslation: false,
      clipboardTranslation: false,
      clipboardTranslationKeyName: 'F4'
    };

    // 获取选项的名称
    const optionsName = Object.keys(options);
    let values = []; // 用来存储要写入的 SQL VALUES
    let sqlPlaceholder = []; // 用来存储 SQL 占位符

    optionsName.forEach(item => {
      let value = '';
      // 把 Number 类型的值转为 String
      if (typeof options[item] === 'number') {
        value = String(options[item]);
      }
      // 把 Boolean 类型的值转为 String
      if (typeof options[item] === 'boolean') {
        value = String(Number(options[item]));
      }
      // 如果是 String 类型的就直接加入 value
      if (typeof options[item] === 'string') {
        value = options[item];
      }
      // 把选项名和选项值加入 values
      values.push(item);
      values.push(value);
      // 把 SQL 占位符加入 sqlPlaceholder
      sqlPlaceholder.push('(?, ?)');
    });

    const sql = `
    INSERT INTO ocr_options
    (name, value)
    VALUES
    ${sqlPlaceholder.join(',')}
    `;
    return new Promise(resolve => {
      this.db.run(sql, values, function (err) {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        resolve({ result: 'success', count: this.changes });
      });
    });
  }

  // 创建选项数据表
  createOptionsTable() {
    const sql = `
    CREATE TABLE ocr_options (
    name VARCHAR (250) NOT NULL,
    value VARCHAR (300) NOT NULL DEFAULT ""
    )
    `;
    return new Promise(resolve => {
      this.db.run(sql, async err => {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        // 查询是否创建成功
        const result = await this.optionsTableExists();
        resolve(result);
      });
    });
  }

  // 添加 OCR 历史记录
  addOcrHistory(provider, ocrType) {
    // 获取时间戳
    const time = Math.round(new Date().getTime() / 1000);
    // 添加数据
    const sql = `
    INSERT INTO ocr_history
    (name, provider, ocr_time)
    VALUES
    (?, ?, ?)
    `;
    return new Promise(resolve => {
      this.db.run(sql, [ocrType, provider, time], function (err) {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        resolve({ result: 'success', count: this.changes });
      });
    });
  }

  // 创建收藏数据表
  createFavoritesTable() {
    const sql = `
    CREATE TABLE favorites (
    id INTEGER PRIMARY KEY,
    language1 VARCHAR (10) NOT NULL,
    language2 VARCHAR (10) NOT NULL,
    src VARCHAR NOT NULL,
    dst VARCHAR NOT NULL,
    created INTEGER NOT NULL DEFAULT 0,
    provider VARCHAR (30) NOT NULL
    )
    `;
    return new Promise(resolve => {
      this.db.run(sql, async err => {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        const result = await this.favoritesTableExists();
        resolve(result);
      });
    });
  }

  // 收藏数据表是否存在
  favoritesTableExists() {
    const sql = `
    SELECT COUNT(*) FROM sqlite_master
    WHERE type="table" AND name="favorites"
    `;
    return new Promise(resolve => {
      this.db.get(sql, (err, row) => {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        resolve({ result: 'success', count: row['COUNT(*)'] });
      });
    });
  }

  // 创建 OCR 历史记录数据表
  createOcrHistoryTable() {
    const sql = `
    CREATE TABLE ocr_history (
    id INTEGER PRIMARY KEY,
    name VARCHAR (50) NOT NULL,
    provider VARCHAR (50) NOT NULL,
    ocr_time INTEGER NOT NULL DEFAULT 0
    )
    `;
    return new Promise(resolve => {
      this.db.run(sql, async err => {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        const result = await this.ocrHistoryTableExists();
        resolve(result);
      });
    });
  }

  // 获取 OCR 历史记录的数量
  ocrHistoryCount() {
    const sql = 'SELECT COUNT(*) AS count FROM ocr_history';
    return new Promise(resolve => {
      this.db.get(sql, (err, row) => {
        if (err) {
          resolve(0);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  // 获取 OCR 历史记录
  async getOcrHistoryList(start = 0, count = 20) {
    // 获取 OCR 历史记录的总数量
    const ocrHistoryCount = await this.ocrHistoryCount();
    // 没有记录就返回
    if (ocrHistoryCount < 1) {
      return { result: 'success', count: 0, list: [] };
    }

    // 从 start 位置查询出 count 条 OCR 记录
    const sql = `
    SELECT id, name, provider, ocr_time
    FROM ocr_history
    ORDER BY ocr_time DESC
    LIMIT ?, ?
    `;

    return new Promise(async resolve => {
      this.db.all(sql, [start, count], (err, rows) => {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        // 时间戳格式化
        for (let i = 0; i < rows.length; i++) {
          rows[i].ocr_time = Datetime.timestampFormat(rows[i].ocr_time);
        }

        resolve({ result: 'success', count: ocrHistoryCount, list: rows });
      });
    });
  }

  // 获取腾讯 OCR 记录总览
  getTencentOcrHistoryOverview() {
    const dataList = []; // 用来存储查询出的数据
    const monthFirstDay = Datetime.monthFirstDayTimestamp();
    // 要执行的 SQL
    const sqlList = [
      {
        name: '腾讯 OCR 总使用量',
        sql: `SELECT COUNT(*) FROM ocr_history WHERE provider = ?`,
        values: ['tencent']
      },
      {
        name: '本月腾讯 OCR 使用量',
        sql: `
        SELECT COUNT(*) FROM ocr_history
        WHERE provider = ? AND ocr_time > ?
        `,
        values: ['tencent', monthFirstDay]
      },
      {
        name: '本月腾讯云通用印刷体识别使用量',
        sql: `
        SELECT COUNT(*) FROM ocr_history
        WHERE name = ? AND ocr_time > ?
        `,
        values: ['腾讯云通用印刷体识别', monthFirstDay]
      },
      {
        name: '本月腾讯云通用印刷体识别（高精度版）使用量',
        sql: `
        SELECT COUNT(*) FROM ocr_history
        WHERE name = ? AND ocr_time > ?
        `,
        values: ['腾讯云通用印刷体识别（高精度版）', monthFirstDay]
      },
      {
        name: '本月腾讯云通用手写体识别使用量',
        sql: `
        SELECT COUNT(*) FROM ocr_history
        WHERE name = ? AND ocr_time > ?
        `,
        values: ['腾讯云通用手写体识别', monthFirstDay]
      },
      {
        name: '本月腾讯云广告文字识别使用量',
        sql: `
        SELECT COUNT(*) FROM ocr_history
        WHERE name = ? AND ocr_time > ?
        `,
        values: ['腾讯云广告文字识别', monthFirstDay]
      },
      {
        name: '本月腾讯云通用印刷体识别（精简版）使用量',
        sql: `
        SELECT COUNT(*) FROM ocr_history
        WHERE name = ? AND ocr_time > ?
        `,
        values: ['腾讯云通用印刷体识别（精简版）', monthFirstDay]
      },
      {
        name: '本月腾讯云通用印刷体识别（高速版）使用量',
        sql: `
        SELECT COUNT(*) FROM ocr_history
        WHERE name = ? AND ocr_time > ?
        `,
        values: ['腾讯云通用印刷体识别（高速版）', monthFirstDay]
      }
    ];

    return new Promise(resolve => {
      // 执行 SQL
      sqlList.forEach(item => {
        this.db.get(item.sql, item.values, (err, row) => {
          dataList.push({
            name: item.name,
            count: row['COUNT(*)']
          });
          if (dataList.length >= sqlList.length) resolve(dataList);
        });
      });
    });
  }

  // 清空指定提供商的 OCR 记录
  deleteAllOcrHistory(provider) {
    const sql = 'DELETE FROM ocr_history WHERE provider = ?';
    return new Promise(resolve => {
      this.db.run(sql, [provider], function (err) {
        if (err) {
          resolve({ result: 'error', msg: err.message });
        } else {
          resolve({ result: 'success', count: this.changes });
        }
      });
    });
  }

  // 获取有道 OCR 记录总览
  getYoudaoOcrHistoryOverview() {
    const dataList = []; // 用来存储查询出的数据
    const monthFirstDay = Datetime.monthFirstDayTimestamp();
    // 要执行的 SQL
    const sqlList = [
      {
        name: '有道通用文字识别总使用量',
        sql: `SELECT COUNT(*) FROM ocr_history WHERE provider = ?`,
        values: ['youdao']
      },
      {
        name: '本月有道通用文字识别使用量',
        sql: `
        SELECT COUNT(*) FROM ocr_history
        WHERE provider = ? AND ocr_time > ?
        `,
        values: ['youdao', monthFirstDay]
      }
    ];

    return new Promise(resolve => {
      // 执行 SQL
      sqlList.forEach(item => {
        this.db.get(item.sql, item.values, (err, row) => {
          dataList.push({
            name: item.name,
            count: row['COUNT(*)']
          });
          if (dataList.length >= sqlList.length) resolve(dataList);
        });
      });
    });
  }

  // 获取讯飞 OCR 记录总览
  getXunfeiOcrHistoryOverview() {
    const dataList = []; // 用来存储查询出的数据
    const monthFirstDay = Datetime.monthFirstDayTimestamp();
    // 要执行的 SQL
    const sqlList = [
      {
        name: '讯飞通用文字识别总使用量',
        sql: `SELECT COUNT(*) FROM ocr_history WHERE provider = ?`,
        values: ['xunfei']
      },
      {
        name: '本月讯飞通用文字识别使用量',
        sql: `
        SELECT COUNT(*) FROM ocr_history
        WHERE provider = ? AND ocr_time > ?
        `,
        values: ['xunfei', monthFirstDay]
      }
    ];

    return new Promise(resolve => {
      // 执行 SQL
      sqlList.forEach(item => {
        this.db.get(item.sql, item.values, (err, row) => {
          dataList.push({
            name: item.name,
            count: row['COUNT(*)']
          });
          if (dataList.length >= sqlList.length) resolve(dataList);
        });
      });
    });
  }

  // 获取百度 OCR 记录总览
  getBaiduOcrHistoryOverview() {
    const dataList = []; // 用来存储查询出的数据
    const monthFirstDay = Datetime.monthFirstDayTimestamp();
    // 要执行的 SQL
    const sqlList = [
      {
        name: '百度 OCR 总使用量',
        sql: `SELECT COUNT(*) FROM ocr_history WHERE provider = ?`,
        values: ['baidu']
      },
      {
        name: '本月百度 OCR 使用量',
        sql: `
        SELECT COUNT(*) FROM ocr_history
        WHERE provider = ? AND ocr_time > ?
        `,
        values: ['baidu', monthFirstDay]
      },
      {
        name: '本月百度云通用文字识别（标准版）使用量',
        sql: `
        SELECT COUNT(*) FROM ocr_history
        WHERE name = ? AND ocr_time > ?
        `,
        values: ['百度云通用文字识别（标准版）', monthFirstDay]
      },
      {
        name: '本月百度云通用文字识别（高精度版）使用量',
        sql: `
        SELECT COUNT(*) FROM ocr_history
        WHERE name = ? AND ocr_time > ?
        `,
        values: ['百度云通用文字识别（高精度版）', monthFirstDay]
      }
    ];

    return new Promise(resolve => {
      // 执行 SQL
      sqlList.forEach(item => {
        this.db.get(item.sql, item.values, (err, row) => {
          dataList.push({
            name: item.name,
            count: row['COUNT(*)']
          });
          if (dataList.length >= sqlList.length) resolve(dataList);
        });
      });
    });
  }

  // 添加翻译历史记录
  addTranslationHistory(provider, wordCount) {
    // 获取时间戳
    const time = Math.round(new Date().getTime() / 1000);
    // 添加数据
    const sql = `
    INSERT INTO translation_history
    (provider, translation_time, word_count)
    VALUES
    (?, ?, ?)
    `;
    return new Promise(resolve => {
      this.db.run(sql, [provider, time, wordCount], function (err) {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }

        if (this.changes < 1) {
          resolve({ result: 'error', msg: '无法添加数据！' });
          return false;
        }

        resolve({ result: 'success', count: this.changes });
      });
    });
  }

  // 创建翻译历史记录数据表
  createTranslationHistoryTable() {
    const sql = `
    CREATE TABLE translation_history (
    id INTEGER PRIMARY KEY,
    provider VARCHAR (50) NOT NULL,
    translation_time INTEGER NOT NULL DEFAULT 0,
    word_count INTEGER NOT NULL
    )
    `;
    return new Promise((resolve, reject) => {
      this.db.run(sql, async err => {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        const result = await this.translationHistoryTableExists();
        resolve(result);
      });
    });
  }

  // 清空翻译历史记录
  deleteAllTranslationHistory(provider) {
    const sql = 'DELETE FROM translation_history WHERE provider = ?';
    return new Promise(resolve => {
      this.db.run(sql, [provider], function (err) {
        if (err) {
          resolve({ result: 'error', msg: err.message });
        } else {
          resolve({ result: 'success', count: this.changes });
        }
      });
    });
  }

  // 获取翻译记录的数量
  getTranslationHistoryCount() {
    const sql = 'SELECT COUNT(*) AS count FROM translation_history';
    return new Promise(resolve => {
      this.db.get(sql, (err, row) => {
        if (err) {
          resolve(0);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  // 获取翻译历史记录
  getTranslationHistoryList(start = 0, count = 20) {
    const dataList = {};

    return new Promise(async resolve => {
      // 获取翻译记录数量
      const historyCount = await this.getTranslationHistoryCount();
      if (historyCount < 1) {
        resolve({ result: 'success', count: 0, list: [] });
        return false;
      }

      // 从 start 开始，查询出 count 条翻译记录
      const sql = `
      SELECT id, provider, translation_time, word_count
      FROM translation_history
      ORDER BY translation_time DESC
      LIMIT ?, ?
      `;
      this.db.all(sql, [start, count], (err, rows) => {
        // 时间格式化
        for (let i = 0; i < rows.length; i++) {
          rows[i].translation_time = Datetime.timestampFormat(rows[i].translation_time);
        }

        resolve({ result: 'success', count: historyCount, list: rows });
      });
    });
  }

  // 获取翻译字数，用于总览数据
  getTranslationwordCount(start = 0, provider = 'baidu') {
    const sql = `
    SELECT SUM(word_count) AS count FROM translation_history
    WHERE translation_time >= ? AND provider = ?
    `;

    return new Promise(resolve => {
      this.db.get(sql, [start, provider], (error, row) => {
        if (error) {
          resolve(0);
        }else {
          resolve(row.count === null ? 0 : row.count);
        }
      });
    });
  }

  // 获取翻译历史记录总览数据
  async getTranslationHistoryOverview() {
    // 获取本月的时间戳
    const thisMonth = Datetime.monthFirstDayTimestamp();
    // 查询百度翻译字数
    const baidu = [
      {
        name: '百度翻译总字数',
        count: await this.getTranslationwordCount(0, 'baidu')
      },
      {
        name: '本月百度翻译字数',
        count: await this.getTranslationwordCount(thisMonth, 'baidu')
      }
    ];
    // 查询腾讯翻译字数
    const tencent = [
      {
        name: '腾讯翻译总字数',
        count: await this.getTranslationwordCount(0, 'tencent')
      },
      {
        name: '本月腾讯翻译字数',
        count: await this.getTranslationwordCount(thisMonth, 'tencent')
      }
    ];
    // 查询讯飞翻译字数
    const xunfei = [
      {
        name: '讯飞翻译总字数',
        count: await this.getTranslationwordCount(0, 'xunfei')
      },
      {
        name: '本月讯飞翻译字数',
        count: await this.getTranslationwordCount(thisMonth, 'xunfei')
      }
    ];
    // 查询有道翻译字数
    const youdao = [
      {
        name: '有道翻译总字数',
        count: await this.getTranslationwordCount(0, 'youdao')
      },
      {
        name: '本月有道翻译字数',
        count: await this.getTranslationwordCount(thisMonth, 'youdao')
      }
    ];

    return {baidu: baidu, tencent: tencent, xunfei: xunfei, youdao: youdao};
  }

  // OCR 历史记录的数据表是否存在
  ocrHistoryTableExists() {
    // 查询出 OCR 历史表格的数量
    const sql = `
    SELECT COUNT(*) FROM sqlite_master
    WHERE type="table" AND name="ocr_history"
    `;
    return new Promise(resolve => {
      this.db.get(sql, (err, row) => {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        resolve({ result: 'success', count: row['COUNT(*)'] });
      });
    });
  }

  // 翻译历史记录的数据表是否存在
  translationHistoryTableExists() {
    // 查询出翻译记录表格的数量
    const sql = `
    SELECT COUNT(*) FROM sqlite_master
    WHERE type="table" AND name="translation_history"
    `;
    return new Promise(resolve => {
      this.db.get(sql, (err, row) => {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        resolve({ result: 'success', count: row['COUNT(*)'] });
      });
    });
  }

  // 存储选项的数据表是否存在
  optionsTableExists() {
    // 查询出选项表格的数量
    const sql = `
    SELECT COUNT(*) FROM sqlite_master
    WHERE type="table" AND name="ocr_options"
    `;
    return new Promise(resolve => {
      this.db.get(sql, (err, row) => {
        if (err) {
          resolve({ result: 'error', msg: err.message });
          return false;
        }
        resolve({ result: 'success', count: row['COUNT(*)'] });
      });
    });
  }
};