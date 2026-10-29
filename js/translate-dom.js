// DOM-walking translation: translates all text nodes and attributes
const _i18nOrig = new WeakMap();
function translateDOM(root){
  if(!root) root = document.body;
  if(!root) return;
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'ar';
  if(lang === 'ar') return;
  if(!window.TRANSLATE_DICT) return;

  const dict = window.TRANSLATE_DICT;

  // Walk text nodes
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  let node;
  while(node = walker.nextNode()){ nodes.push(node); }

  nodes.forEach(n => {
    if(!_i18nOrig.has(n)) _i18nOrig.set(n, n.nodeValue);
    const original = n.nodeValue;
    if(!original || !original.trim()) return;
    let text = original;
    // Normalize non-breaking spaces for matching
    const normalized = text.replace(/\u00A0/g, ' ').replace(/&nbsp;/g, ' ').trim();
    // Try exact match first
    if(dict[normalized]){
      n.nodeValue = original.replace(text.trim(), dict[normalized]);
      return;
    }
    const trimmed = text.trim();
    if(dict[trimmed]){
      n.nodeValue = original.replace(trimmed, dict[trimmed]);
      return;
    }
    // Exact match only (partial matching causes mixed-language artifacts)
    // Already handled above
    if(text !== original){
      n.nodeValue = text;
    }
  });

  // Translate placeholders
  root.querySelectorAll('[placeholder]').forEach(el => {
    if(!el.hasAttribute('data-orig-ph')) el.setAttribute('data-orig-ph', el.getAttribute('placeholder'));
    const ph = el.getAttribute('data-orig-ph');
    if(ph && dict[ph]){
      el.setAttribute('placeholder', dict[ph]);
    } else if(ph){
      // Partial match for placeholder
      let t = ph;
      const keys = Object.keys(dict).sort((a,b) => b.length - a.length);
      for(const key of keys){
        if(key.length < 2) continue;
        if(t.includes(key)){ t = t.split(key).join(dict[key]); }
      }
      if(t !== ph) el.setAttribute('placeholder', t);
    }
  });

  // Translate titles
  root.querySelectorAll('[title]').forEach(el => {
    const t = el.getAttribute('title');
    if(t && dict[t]){
      el.setAttribute('title', dict[t]);
    }
  });
}

function restoreDOM(root){
  if(!root) root = document.body;
  if(!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  let node;
  while(node = walker.nextNode()){ nodes.push(node); }
  nodes.forEach(n => {
    const orig = _i18nOrig.get(n);
    if(orig !== undefined) n.nodeValue = orig;
  });
  root.querySelectorAll('[placeholder]').forEach(el => {
    const orig = el.getAttribute('data-orig-ph');
    if(orig !== null) el.setAttribute('placeholder', orig);
  });
}
// Auto-translate is triggered by callers (initApp, applyPage, setLang)

// Run translateDOM multiple times to handle nested/partial translations
function translateDOMMulti(){
  if(typeof translateDOM !== 'function') return;
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'ar';
  if(lang === 'ar') return;
  translateDOM(document.body);
  setTimeout(() => translateDOM(document.body), 100);
  setTimeout(() => translateDOM(document.body), 500);
  setTimeout(() => translateDOM(document.body), 1500);
}

// Periodic translation to catch re-rendered content
setInterval(function(){
  if(document.hidden) return;
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'ar';
  if(lang === 'ar') return;
  if(typeof translateDOM === 'function') translateDOM(document.body);
}, 8000);

// MutationObserver: translate new content as it's added
(function(){
  if(typeof MutationObserver === 'undefined') return;
  const observer = new MutationObserver(function(mutations){
    const lang = (typeof currentLang !== 'undefined') ? currentLang : 'ar';
    if(lang === 'ar') return;
    mutations.forEach(function(m){
      m.addedNodes.forEach(function(node){
        if(node.nodeType === 1){ // Element — skip; 8s ticker + initial walk already cover this
          return;
        } else if(node.nodeType === 3){ // Text node
          const text = node.nodeValue.trim();
          if(text && window.TRANSLATE_DICT && window.TRANSLATE_DICT[text]){
            node.nodeValue = node.nodeValue.replace(text, window.TRANSLATE_DICT[text]);
          }
        }
      });
    });
  });
  if(document.body){
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
