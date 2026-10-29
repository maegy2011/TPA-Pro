function createGhost(sourceEl, e){
  const clone = sourceEl.cloneNode(true);
  clone.classList.add('drag-ghost');
  clone.style.width = sourceEl.offsetWidth + 'px';
  const rect = sourceEl.getBoundingClientRect();
  clone.style.left = '0px';
  clone.style.top = '0px';
  clone.style.transform = `translate(${e.clientX+12}px, ${e.clientY+12}px)`;
  document.body.appendChild(clone);
  dragGhost = clone;
}

function updateGhost(e){
  if(!dragGhost) return;
  rafId = requestAnimationFrame(() => {
    if(dragGhost) dragGhost.style.transform = `translate(${e.clientX+12}px, ${e.clientY+12}px)`;
  });
}

function showDropIndicator(targetEl, position){
  clearDropIndicators();
  if(position === 'before') targetEl.classList.add('drop-before');
  else if(position === 'after') targetEl.classList.add('drop-after');
  else if(position === 'into') targetEl.classList.add('drop-into');
  else if(position === 'before-group') targetEl.classList.add('drop-before-group');
  else if(position === 'after-group') targetEl.classList.add('drop-after-group');
}

function clearDropIndicators(){
  document.querySelectorAll('.drop-before,.drop-after,.drop-before-group,.drop-after-group,.drop-into,.drop-target-end,.drop-active').forEach(el => {
    el.classList.remove('drop-before','drop-after','drop-before-group','drop-after-group','drop-into','drop-target-end','drop-active');
  });
}

function recordFlipFirst(){
  flipFirst = {};
  document.querySelectorAll('[data-drag-path]').forEach(el => {
    flipFirst[el.dataset.dragPath] = el.getBoundingClientRect();
  });
}

function playFlip(){
  if(!flipFirst) return;
  document.querySelectorAll('[data-drag-path]').forEach(el => {
    const first = flipFirst[el.dataset.dragPath];
    if(!first) return;
    const last = el.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    if(dx || dy){
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = 'none';
      requestAnimationFrame(() => {
        el.style.transition = 'transform .2s ease';
        el.style.transform = '';
      });
    }
  });
  flipFirst = null;
}

function flashMovedItem(path){
  const el = document.querySelector(`[data-drag-path="${path}"]`);
  if(el){ el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 400); }
}

function autoScroll(e){
  const container = document.getElementById('condList');
  if(!container) return;
  const rect = container.getBoundingClientRect();
  const threshold = 40;
  if(e.clientY < rect.top + threshold){ container.scrollTop -= 8; }
  else if(e.clientY > rect.bottom - threshold){ container.scrollTop += 8; }
}
