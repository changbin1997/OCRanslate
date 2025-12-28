import {
  imgEl,
  overlayEl,
  selectBoxEl,
  finishBtnEl,
  clearBtnEl,
  topBtn, rightBtn, bottomBtn, leftBtn
} from './DOM.js';

import Selection from './Selection.js';

let mouseActive = false;
const selection = new Selection();

// 截图完成
window.electronAPI.onResponse('img', (ev, result) => {
  // 在 img 中显示图片
  const blob = new Blob([result], {type: 'image/png'});
  imgEl.src = URL.createObjectURL(blob);
});

// 图像显示区域鼠标按下
overlayEl.addEventListener('mousedown', ev => {
  if (!selection.imgSelected) {
    selection.startSelect(ev, imgEl.src);
    mouseActive = true;
  }
});

// 图像显示区域鼠标移动
document.addEventListener('mousemove', ev => {
  // 缩放截图区域
  if (!selection.imgSelected && mouseActive) selection.select(ev);
  // 图片选择框移动
  if (selection.moveSelectBox && mouseActive) selection.selectBoxMove(ev);
  // 缩放按钮移动
  if (mouseActive) selection.moveZoom(ev);
});

// 图像显示区域鼠标放开
document.addEventListener('mouseup', () => {
  mouseActive = false;
  // 区域选择放开
  if (!selection.imgSelected) {
    // 如果图片选择框大小 <= 2 就取消选择，可以避免只是点击就弹出图片工具栏
    if (!selection.imgSelected && selectBoxEl.offsetWidth <= 2 || selectBoxEl.offsetHeight <= 2) {
      selectBoxEl.style.display = 'none';
      return false;
    }
    // 显示工具栏
    selection.showToolbar(selection.getSelectBoxPosition());
    if (!selection.imgSelected) selection.imgSelected = true;  // 图片选择完成
  }
  // 拖拽移动位置放开
  if (selection.moveSelectBox) {
    selection.moveSelectBox = false;  // 取消拖拽移动
    // 显示工具栏
    selection.showToolbar(selection.getSelectBoxPosition());
  }
  // 拖拽缩放按钮放开
  if (selection.zoomActive.top || selection.zoomActive.right || selection.zoomActive.bottom || selection.zoomActive.left) {
    // 停止缩放
    selection.stopZoom();
    // 显示工具栏
    selection.showToolbar(selection.getSelectBoxPosition());
  }
  // 显示缩放按钮
  selection.showZoomBtn();
});

// 图片选择框鼠标按下（拖拽移动）
selectBoxEl.addEventListener('mousedown', ev => {
  // 隐藏图片工具栏
  selection.hideToolbar();
  selection.selectBoxStartMove(ev);
  mouseActive = true;
});

// 拖拽缩放按钮鼠标按下，准备缩放
[topBtn, rightBtn, bottomBtn, leftBtn].forEach(el => {
  el.addEventListener('mousedown', ev => {
    selection.startZoom(ev);
    selection.hideToolbar();
    mouseActive = true;
  });
});

// 选择完成按钮点击
finishBtnEl.addEventListener('click', () => {
  // 获取选择的尺寸和位置
  const selectBoxPosition = selection.getSelectBoxPosition();
  selectBoxPosition.result = 'success';
  window.electronAPI.ipcRenderer.invoke('complete', selectBoxPosition);
});

// 取消选择按钮点击
clearBtnEl.addEventListener('click', () => {
  window.electronAPI.ipcRenderer.invoke('close-window');
});

// ESC 键关闭选择窗口
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') clearBtnEl.click();
});