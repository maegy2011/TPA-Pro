function clearDragState(){
  document.querySelectorAll('.dragging,.drop-before,.drop-after,.drop-before-group,.drop-after-group,.drop-into,.drop-target-end,.drop-active').forEach(el => {
    el.classList.remove('dragging','drop-before','drop-after','drop-before-group','drop-after-group','drop-into','drop-target-end','drop-active');
  });
  if(dragGhost){ dragGhost.remove(); dragGhost = null; }
  document.body.style.userSelect = '';
  if(rafId){ cancelAnimationFrame(rafId); rafId = null; }
  if(autoScrollInterval){ clearInterval(autoScrollInterval); autoScrollInterval = null; }
  dragSrcPath = null; dragSrcParent = null; dragSrcIndex = -1;
  dropTarget = null; flipFirst = null; dragThresholdMet = false;
}

function handleDragStart(e){
  const handle = e.target.closest('.cond-drag-handle');
  if(!handle) return;
  const item = handle.closest('[data-drag-path]');
  if(!item) return;
  dragSrcPath = item.dataset.dragPath;
  const info = getPathInfo(dragSrcPath);
  if(!info) return;
  dragSrcParent = info.parentPath;
  dragSrcIndex = info.index;
  dragStartX = e.clientX; dragStartY = e.clientY;
  dragThresholdMet = false;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcPath);
  item.classList.add('dragging');
  item.setAttribute('aria-grabbed', 'true');
  document.body.style.userSelect = 'none';
  createGhost(item, e);
  recordFlipFirst();
  // Activate drop zones
  document.querySelectorAll('.cond-list').forEach(cl => cl.classList.add('drop-active'));
}

function handleDrag(e){
  if(!dragSrcPath) return;
  if(!dragThresholdMet){
    const dx = e.clientX - dragStartX, dy = e.clientY - dragStartY;
    if(Math.sqrt(dx*dx+dy*dy) < 5) return;
    dragThresholdMet = true;
  }
  updateGhost(e);
  autoScroll(e);
}

function handleDragOver(e){
  if(!dragSrcPath) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const target = e.target.closest('[data-drag-path],[data-drop-container]');
  if(!target) return;
  const isGroup = target.classList.contains('cond-group');
  const isItem = target.classList.contains('cond-item');
  const isContainer = target.hasAttribute('data-drop-container') && !target.hasAttribute('data-drag-path');
  // Determine position
  let position = 'after';
  let targetPath = target.dataset.dragPath || '';
  let containerPath = target.dataset.dropContainer || '';
  if(isGroup && e.target.closest('.cond-group-head')){
    // Dropping into group
    position = 'into';
    targetPath = target.dataset.dragPath;
    containerPath = targetPath;
  } else if(isItem){
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    position = e.clientY < midY ? 'before' : 'after';
  } else if(isContainer){
    position = 'end';
    containerPath = target.dataset.dropContainer || '';
  }
  // Validate: block self/descendant drop
  if(targetPath && (dragSrcPath === targetPath || isAncestor(dragSrcPath, targetPath))) {
    e.dataTransfer.dropEffect = 'none';
    clearDropIndicators();
    return;
  }
  // Update indicators
  clearDropIndicators();
  if(position === 'into'){
    target.classList.add('drop-into');
  } else if(position === 'before'){
    target.classList.add('drop-before');
  } else if(position === 'after'){
    target.classList.add('drop-after');
  } else if(position === 'end'){
    target.classList.add('drop-target-end');
  }
  dropTarget = { containerPath, targetPath, position };
}

function handleDragLeave(e){
  // small delay to avoid flicker
  setTimeout(() => {
    const t = e.target;
    if(t && t.classList) t.classList.remove('drop-before','drop-after','drop-into','drop-before-group','drop-after-group','drop-target-end');
  }, 50);
}

function handleDrop(e){
  if(!dragSrcPath || !dropTarget) return;
  e.preventDefault();
  const { containerPath, targetPath, position } = dropTarget;
  // Validate
  if(dragSrcPath === targetPath) { clearDragState(); return; }
  if(isAncestor(dragSrcPath, targetPath)) { clearDragState(); return; }
  // Determine insertion index
  let insertIndex = 0;
  const targetArr = containerPath === '' ? wizState.conditions.rules : getPathInfo(containerPath)?.item?.rules;
  if(!targetArr){ clearDragState(); return; }
  if(position === 'into' || position === 'end'){
    insertIndex = targetArr.length;
  } else if(targetPath){
    const targetInfo = getPathInfo(targetPath);
    if(targetInfo){
      insertIndex = position === 'before' ? targetInfo.index : targetInfo.index + 1;
    }
  }
  // Adjust index if same container and src before target
  const srcInfo = getPathInfo(dragSrcPath);
  if(srcInfo && srcInfo.parentPath === containerPath && srcInfo.index < insertIndex){
    insertIndex--;
  }
  // Remove source
  const item = removeAtPath(dragSrcPath);
  if(!item){ clearDragState(); return; }
  // Insert at target
  insertAtPath(containerPath, insertIndex, item);
  // Re-render
  wizRenderConditions();
  // Flash moved item
  setTimeout(() => flashMovedItem(item.logic ? 'g' + wizState.conditions.rules.indexOf(item) : 'c' + wizState.conditions.rules.indexOf(item)), 50);
  // FLIP
  playFlip();
  clearDragState();
}

function handleDragEnd(e){
  clearDragState();
}
