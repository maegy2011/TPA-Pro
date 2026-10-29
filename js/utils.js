const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const escapeHtml = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const PASSWORD = 'TPA2025';
const AUTH_KEY = 'tpa_pro_auth';
const APP_SETTINGS_KEY = 'tpa_pro_settings';
const DATA_STORE_KEY = 'tpa_pro_data_store';
const SESSIONS_KEY = 'tpa_pro_sessions';
const LAST_BACKUP_KEY = 'tpa_last_backup';
const PWD_HASH_KEY = 'tpa_pwd_hash';
const ONBOARDING_KEY = 'tpa_onboarding_done';
const DATA_VERSION = 1;
const fmt = n => Number(n || 0).toLocaleString('en-US');
const fmtC = n => fmt(n) + ' ر.س';
let appSettings = {
  reviewer: { name: 'المراجع', role: 'مراجع مالي معتمد' },
  company: { name: 'TPA', brand: 'TPA Pro', tagline: 'نظام المراجعة المالية للمطالبات الطبية', version: 'v1.0' }
};
function loadAppSettings(){
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if(raw){
      const p = JSON.parse(raw);
      if(p && p.reviewer) appSettings.reviewer = { ...appSettings.reviewer, ...p.reviewer };
      if(p && p.company) appSettings.company = { ...appSettings.company, ...p.company };
    }
  } catch(e){}
}
function saveAppSettings(){
  try { localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings)); } catch(e){}
}
loadAppSettings();
async function hashPassword(pwd){
  try {
    if(window.crypto && crypto.subtle){
      const buf = new TextEncoder().encode(pwd + '::tpa_salt_2025');
      const hash = await crypto.subtle.digest('SHA-256', buf);
      return 'sha256_' + Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
    }
  } catch(e){}
  let h = 0;
  for(let i = 0; i < pwd.length; i++){ h = ((h << 5) - h + pwd.charCodeAt(i)) | 0; }
  return 'simple_' + Math.abs(h).toString(16);
}
async function verifyPassword(pwd){
  try {
    const stored = localStorage.getItem(PWD_HASH_KEY);
    if(!stored) return pwd === PASSWORD;
    const hash = await hashPassword(pwd);
    return hash === stored;
  } catch(e){ return false; }
}
async function changePassword(oldPwd, newPwd){
  const ok = await verifyPassword(oldPwd);
  if(!ok) throw new Error('كلمة المرور الحالية غير صحيحة');
  if(!newPwd || newPwd.length < 6) throw new Error('كلمة المرور الجديدة قصيرة (6 أحرف على الأقل)');
  const hash = await hashPassword(newPwd);
  localStorage.setItem(PWD_HASH_KEY, hash);
}
function daysFromNow(n){ const d = new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function formatDate(d){ return d || '—'; }
function formatMonth(m){
  if(!m) return '—';
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const p = m.split('-');
  return months[parseInt(p[1], 10)-1] + ' ' + p[0];
}
function toDate(v){
  if(!v) return null;
  if(v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function resolveDateKeyword(v){
  if(!v) return null;
  const s = String(v).trim().toLowerCase();
  const today = new Date(); today.setHours(0,0,0,0);
  const fmtD = d => d.toISOString().slice(0,10);
  if(s === 'today' || s === 'now') return fmtD(today);
  if(s === 'yesterday') return fmtD(new Date(today.getTime()-86400000));
  if(s === 'tomorrow') return fmtD(new Date(today.getTime()+86400000));
  if(s === 'start_of_month'){ const d=new Date(today); d.setDate(1); return fmtD(d); }
  if(s === 'end_of_month'){ const d=new Date(today); d.setMonth(d.getMonth()+1,0); return fmtD(d); }
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  return s;
}
function daysBetween(a, b){
  const da = toDate(a), db = toDate(b);
  if(!da || !db) return null;
  return Math.round((db - da) / 86400000);
}
function daysRemaining(endDate){
  if(!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / (1000*60*60*24));
}
function daysRemainingText(endDate){
  if(!endDate) return '—';
  const d = daysRemaining(endDate);
  if(d < 0) return `منتهي منذ ${Math.abs(d)} يوم`;
  if(d === 0) return 'ينتهي اليوم';
  return `${d} يوم`;
}
function daysRemainingClass(endDate){
  const d = daysRemaining(endDate);
  if(d === null) return '';
  if(d < 0) return 'bad';
  if(d <= 60) return 'warn';
  return 'good';
}
function countWorkingDays(a, b){
  const da = toDate(a), db = toDate(b);
  if(!da || !db) return 0;
  const start = da < db ? da : db, end = da < db ? db : da;
  let count = 0; const cur = new Date(start);
  while(cur <= end){ const dow = cur.getDay(); if(dow !== 5 && dow !== 6) count++; cur.setDate(cur.getDate()+1); }
  return count;
}
function isBusinessDay(d){ if(!d) return false; const dow = d.getDay(); return dow !== 5 && dow !== 6; }
function isSameWeek(a, b){
  if(!a || !b) return false;
  const sow = d => { const x = new Date(d); x.setDate(x.getDate()-x.getDay()); x.setHours(0,0,0,0); return x.getTime(); };
  return sow(a) === sow(b);
}
function dayOfYear(d){ if(!d) return null; const s = new Date(d.getFullYear(),0,0); return Math.floor((d-s)/86400000); }
function getDaysInMonth(d){ return d ? new Date(d.getFullYear(), d.getMonth()+1, 0).getDate() : null; }
function getDaysInYear(d){ if(!d) return null; const y = d.getFullYear(); return ((y%4===0 && y%100!==0) || y%400===0) ? 366 : 365; }
function normalizeArabic(str){
  return String(str||'').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/\u0640/g,'')
    .replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ة/g,'ه')
    .toLowerCase().trim();
}
function toEnglishDigits(s){ return String(s||'').replace(/[٠-٩]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48)); }
function parseNumber(val){
  if(typeof val === 'number' && !isNaN(val)) return val;
  if(val === null || val === undefined || val === '') return 0;
  let s = toEnglishDigits(String(val)).replace(/[,\u066C]/g,'').replace(/\u066B/g,'.').replace(/[^\d.\-+eE]/g,'');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
function roundMoney(n){ return Math.round((Number(n)||0) * 100) / 100; }
function roundToNearest(v, step){ const s = parseNumber(step)||1; return Math.round(parseNumber(v)/s)*s; }
function isMultipleOf(v, step){ const s = parseNumber(step)||1; if(s === 0) return false; const m = Math.abs(parseNumber(v) % s); return m < 0.001 || Math.abs(m-s) < 0.001; }
function pctOf(v, base){ const b = parseNumber(base); if(b === 0) return null; return (parseNumber(v)/b)*100; }
function pctDiff(a, b){ const bv = parseNumber(b); if(bv === 0) return null; return Math.abs((parseNumber(a)-bv)/bv*100); }
