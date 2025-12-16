module.exports = class Datetime {
  /**
   * 获取本月第一天的时间戳
   * @returns {number} 返回本月第一天的时间戳
   */
  static monthFirstDayTimestamp() {
    return Math.round(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000
    );
  }

  /**
   * 将时间戳格式化为可读的时间字符串
   * @param {number} timestamp 时间戳（秒）
   * @returns {string} 返回格式化的时间字符串，例如 "2025年12月15日 14:30"
   */
  static timestampFormat(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    let minute = date.getMinutes();
    if (minute < 10) minute = '0' + minute;
    return `${year}年${month}月${day}日 ${hour}:${minute}`;
  }

  /**
   * 获取当前的时间戳
   * @returns {number} 返回当前时间的时间戳（秒）
   */
  static timestamp() {
    return Math.round(new Date().getTime() / 1000);
  }

  /**
   * 根据指定格式将时间戳格式化
   * @param {string} format 格式字符串，可用占位符：y(年)、m(月)、d(日)、h(时)、i(分)、s(秒)
   * @param {number} timestamp 时间戳（秒）
   * @returns {string} 返回按指定格式化的时间字符串
   */
  static timestampFormat2(format, timestamp) {
    const date = new Date(timestamp * 1000);
    format = format.replace('y', date.getFullYear());
    format = format.replace('m', date.getMonth() + 1);
    format = format.replace('d', date.getDate());
    format = format.replace('h', date.getHours());
    let minute = date.getMinutes();
    if (minute < 10) minute = '0' + minute;
    format = format.replace('i', minute);
    let second = date.getSeconds();
    if (second < 10) second = '0' + second;
    format = format.replace('s', second);
    return format;
  }
};