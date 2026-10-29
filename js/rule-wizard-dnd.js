let dragSrcPath = null, dragSrcParent = null, dragSrcIndex = -1;
let dragGhost = null, dropTarget = null, flipFirst = null, rafId = null;
let dragThresholdMet = false, dragStartX = 0, dragStartY = 0;
let autoScrollInterval = null;
let undoStack = [];

function getPathInfo(path){
  if(!path) return null;
  const nums = String(path).match(/\d+/g);
  if(!nums) return null;
  const idxs = nums.map(Number);
  let parentArr = wizState.conditions.rules;
  let parentPath = '';
  for(let i=0;i<idxs.length-1;i++){
    const node = parentArr[idxs[i]];
    if(!node || !Array.isArray(node.rules)) return null;
    parentArr = node.rules;
    // rebuild parentPath
    if(i===0) parentPath = (node.logic?'g':'c')+idxs[i];
    else parentPath += '_' + (node.rules && node.rules[idxs[i+1]] && node.rules[idxs[i+1]].logic ? 'g' : 'c') + idxs[i+1];
  }
  const index = idxs[idxs.length-1];
  if(index < 0 || index >= parentArr.length) return null;
  return { parentArray: parentArr, index, item: parentArr[index], parentPath: idxs.length===1 ? '' : path.split('_').slice(0,-1).join('_') };
}

function getParentPath(path){
  if(!path) return '';
  const parts = String(path).split('_');
  return parts.length <= 1 ? '' : parts.slice(0,-1).join('_');
}

function isAncestor(srcPath, targetPath){
  if(!srcPath || !targetPath) return false;
  return String(targetPath).startsWith(String(srcPath)+'_');
}

function removeAtPath(path){
  const info = getPathInfo(path);
  if(!info) return null;
  const [removed] = info.parentArray.splice(info.index, 1);
  return removed;
}

function insertAtPath(containerPath, index, item){
  const targetArr = containerPath === '' ? wizState.conditions.rules : (() => {
    const info = getPathInfo(containerPath);
    return info ? info.item.rules : null;
  })();
  if(!targetArr) return false;
  const idx = Math.max(0, Math.min(index, targetArr.length));
  targetArr.splice(idx, 0, item);
  return true;
}

function moveCondition(path, direction){
  const info = getPathInfo(path);
  if(!info) return;
  const arr = info.parentArray;
  const idx = info.index;
  const parentPath = info.parentPath;
  if(direction === 'up'){
    if(idx > 0){
      [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
    } else if(parentPath !== ''){
      // move out of group: insert before the group in parent
      const item = arr.splice(idx, 1)[0];
      const groupInfo = getPathInfo(parentPath);
      if(groupInfo){
        const groupParent = groupInfo.parentArray;
        const groupIdx = groupInfo.index;
        groupParent.splice(groupIdx, 0, item);
      }
    }
  } else {
    if(idx < arr.length - 1){
      [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]];
    } else if(parentPath !== ''){
      const item = arr.splice(idx, 1)[0];
      const groupInfo = getPathInfo(parentPath);
      if(groupInfo){
        const groupParent = groupInfo.parentArray;
        const groupIdx = groupInfo.index;
        groupParent.splice(groupIdx + 1, 0, item);
      }
    }
  }
  wizRenderConditions();
  setTimeout(() => flashMovedItem(path), 50);
}

function initDragDrop(){
  const root = document.getElementById('condList');
  if(!root || root.dataset.dndInit === '1') return;
  root.dataset.dndInit = '1';
  root.addEventListener('dragstart', handleDragStart);
  root.addEventListener('drag', handleDrag);
  root.addEventListener('dragover', handleDragOver);
  root.addEventListener('dragleave', handleDragLeave);
  root.addEventListener('drop', handleDrop);
  root.addEventListener('dragend', handleDragEnd);
  // window-level cleanup
  window.addEventListener('blur', clearDragState);
  document.addEventListener('visibilitychange', () => { if(document.hidden) clearDragState(); });
  // keyboard
  root.addEventListener('keydown', e => {
    if(!e.altKey) return;
    const handle = e.target.closest('.cond-drag-handle');
    if(!handle) return;
    const item = handle.closest('[data-drag-path]');
    if(!item) return;
    e.preventDefault();
    if(e.key === 'ArrowUp') moveCondition(item.dataset.dragPath, 'up');
    else if(e.key === 'ArrowDown') moveCondition(item.dataset.dragPath, 'down');
  });
}
// Bind reorder buttons (called from wizBindConditionHandlers or after render)

function bindReorderButtons(){
  document.querySelectorAll('[data-move-up]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); moveCondition(btn.dataset.moveUp, 'up'); });
  });
  document.querySelectorAll('[data-move-down]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); moveCondition(btn.dataset.moveDown, 'down'); });
  });
}
