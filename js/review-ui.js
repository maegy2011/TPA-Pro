/* review-ui.js — واجهة تبويبات المراجعة */
function renderReviewTabsLayout() {
  const container = document.getElementById('reviewModalContainer');
  if (!container) return;
  container.innerHTML = `
    <div class="rv-tabs" role="tablist">
      <button type="button" class="rv-tab active" data-tab="input" onclick="switchReviewTab('input')">
        📋 1. الإدخال والتدقيق الآلي
      </button>
      <button type="button" class="rv-tab" data-tab="exceptions" onclick="switchReviewTab('exceptions')">
        ⚠️ 2. الاستثناءات المعلقة (<span id="rvExcCountBadge">0</span>)
      </button>
      <button type="button" class="rv-tab" data-tab="final" onclick="switchReviewTab('final')">
        ⚖️ 3. القرار والتخريج القانوني النهائي
      </button>
    </div>
    <div id="rvTabContentArea" class="rv-tab-content"></div>
  `;
}

function switchReviewTab(tabName) {
  document.querySelectorAll('.rv-tab').forEach(t => t.classList.remove('active'));
  const btn = document.querySelector(`[data-tab="${tabName}"]`);
  if (btn) btn.classList.add('active');
  const panels = document.querySelectorAll('.rv-tab-panel');
  panels.forEach(p => { p.style.display = 'none'; });
  const map = { input: 'rvTabInput', exceptions: 'rvTabExceptions', final: 'rvTabFinal' };
  const panel = document.getElementById(map[tabName] || '');
  if (panel) panel.style.display = '';
  if (tabName === 'exceptions' && typeof renderExceptions === 'function') renderExceptions();
  if (tabName === 'final' && typeof renderFinalSummary === 'function') renderFinalSummary();
}