let currentLang = (typeof localStorage !== 'undefined') ? (localStorage.getItem('tpa_lang') || 'ar') : 'ar';
function setLang(lang){
  if(!I18N[lang]) return;
  currentLang = lang;
  try { localStorage.setItem('tpa_lang', lang); } catch(e){}
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
}
function t(key){ const d = I18N[currentLang] || I18N.ar; return d[key] !== undefined ? d[key] : key; }
function isRTL(){ return currentLang === 'ar'; }
