const { Menu } = require('electron');
const ExportResult = require('./ExportResult');

module.exports = class ContextMenu {
  /**
   * 创建并弹出 OCR 识别结果导出菜单
   * @param {number} x 菜单弹出位置的 X 坐标
   * @param {number} y 菜单弹出位置的 Y 坐标
   * @param {Object} result OCR 识别结果对象
   * @returns {void}
   */
  static exportOcrMenu(x, y, result) {
    // 菜单模板
    const menuTemplate = [
      {
        label: '导出为 TXT（不带图片）',
        click() {
          const exportResult = new ExportResult();
          exportResult.ocrResultTxt(result);
        }
      },
      {
        label: '导出为 HTML（带图片）',
        click() {
          const exportResult = new ExportResult();
          exportResult.ocrResultHTML(result);
        }
      }
    ];
    // 构建菜单项
    const menu = Menu.buildFromTemplate(menuTemplate);
    // 弹出菜单
    menu.popup({
      x: x,
      y: y
    });
  }

  /**
   * 创建和弹出翻译 API 选择菜单
   * @param {number} x 菜单顶部位置
   * @param {number} y 菜单左侧位置
   * @param {string} defaultLabel 默认选中的菜单项
   * @returns 返回选中的菜单项
   */
  static translationApiMenu(x, y, defaultLabel = '百度翻译') {
    return new Promise((resolve) => {
      let hasSelected = false;

      const handleClick = (menuItem) => {
        hasSelected = true;
        resolve(menuItem.label);
      };

      const rawTemplate = [
        { label: '百度翻译', type: 'radio' },
        { label: '腾讯翻译', type: 'radio' },
        { label: '讯飞翻译', type: 'radio' },
        { label: '阿里翻译', type: 'radio' },
        { label: '有道翻译', type: 'radio' }
      ];

      // 检查传入的 defaultLabel 是否在列表中，若不在则默认选中第一项
      const isValidLabel = rawTemplate.some(
        (item) => item.label === defaultLabel
      );
      const targetLabel = isValidLabel ? defaultLabel : rawTemplate[0].label;

      // 动态判断 checked 并绑定 click
      const menuTemplate = rawTemplate.map((item) => ({
        ...item,
        checked: item.label === targetLabel,
        click: handleClick
      }));

      const menu = Menu.buildFromTemplate(menuTemplate);

      menu.popup({
        x: x,
        y: y,
        callback: () => {
          if (!hasSelected) {
            // 未做任何修改直接关闭菜单时，返回 null（或根据需要返回 targetLabel）
            resolve(null);
          }
        }
      });
    });
  }

  /**
   * 创建并弹出翻译结果导出菜单
   * @param {number} x 菜单弹出位置的 X 坐标
   * @param {number} y 菜单弹出位置的 Y 坐标
   * @param {Object} result 翻译结果对象
   * @returns {void}
   */
  static exportTranslationMenu(x, y, result) {
    // 菜单模板
    const menuTemplate = [
      {
        label: '导出为 TXT',
        click() {
          const exportResult = new ExportResult();
          exportResult.translationResultTxt(result);
        }
      },
      {
        label: '导出为 HTML',
        click() {
          const exportResult = new ExportResult();
          exportResult.translationResultHTML(result);
        }
      }
    ];
    // 构建菜单项
    const menu = Menu.buildFromTemplate(menuTemplate);
    // 弹出菜单
    menu.popup({
      x: x,
      y: y
    });
  }

  /**
   * 创建并弹出表单文本编辑上下文菜单
   * @param {number} x 菜单弹出位置的 X 坐标
   * @param {number} y 菜单弹出位置的 Y 坐标
   * @returns {void}
   */
  static inputMenu(x, y) {
    // 菜单模板
    const menuTemplate = [
      {
        label: '全选',
        role: 'selectAll'
      },
      {
        label: '剪切',
        role: 'cut'
      },
      {
        label: '复制',
        role: 'copy'
      },
      {
        label: '粘贴',
        role: 'paste'
      }
    ];

    // 构建菜单
    const menu = Menu.buildFromTemplate(menuTemplate);
    // 弹出菜单
    menu.popup({
      x: x,
      y: y
    });
  }
};
