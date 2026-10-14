import { languages, phrases } from './translations.js';
import { extraLanguages, extraTranslations } from './translations-extra.js';

export const supportedLanguages = { ...languages, ...extraLanguages };
const column = { tr: 0, en: 1, ar: 2, ru: 3, de: 4, fr: 5, es: 6 };
const dictionaries = Object.fromEntries(Object.keys(supportedLanguages).map(lang => [lang,
  Object.fromEntries(phrases.map(row => [row[0], extraTranslations[lang]?.[row[0]] || row[column[lang]] || row[0]]))]));
const navigationLabels = { tr:'Ana menü',en:'Main navigation',ar:'القائمة الرئيسية',ru:'Главное меню',de:'Hauptmenü',fr:'Menu principal',es:'Menú principal',bg:'Главно меню',el:'Κύριο μενού',ka:'მთავარი მენიუ',hy:'Գլխավոր ընտրացանկ',az:'Əsas menyu',fa:'منوی اصلی',ro:'Meniu principal',uk:'Головне меню',he:'תפריט ראשי',ku:'Menuya sereke',ckb:'لیستی سەرەکی' };
Object.entries(navigationLabels).forEach(([lang,value]) => { dictionaries[lang]['Ana menü'] = value; });
let language = 'tr';
try {
  const requested = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('lang') : null;
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('sayder-language') : null;
  if (supportedLanguages[requested || saved]) language = requested || saved;
} catch { /* Storage is optional. */ }
export const getLanguage = () => language;
export const getLocale = () => supportedLanguages[language][1];
export function t(source, values = {}, lang = language) {
  const text = dictionaries[lang]?.[source] || source;
  return text.replace(/\{(\w+)\}/g, (token, key) => String(values[key] ?? token));
}
export function stockUnit(unit) {
  if (language === 'tr') return unit;
  return t(({ metre: 'metre', rulo: 'Rulo', adet: 'Adet' })[unit] || unit);
}

// Dynamic UI strings emitted by existing renderers. Product data remains untouched.
const patterns = [
  [/^(\d+) ürün listeleniyor$/, '{count} ürün listeleniyor', ['count']],
  [/^(\d+) ürün · (\d+) gösteriliyor$/, '{count} ürün · {shown} gösteriliyor', ['count','shown']],
  [/^(\d+) ürün · Sayfa (\d+)$/, '{count} ürün · Sayfa {page}', ['count','page']],
  [/^(.+) cm en$/, '{value} cm en', ['value']],
  [/^(.+) m rulo$/, '{value} m rulo', ['value']],
  [/^Ürün kodu: (.+)$/, 'Ürün kodu: {code}', ['code']],
  [/^(.+) detaylarını aç$/, '{name} detaylarını aç', ['name']],
  [/^(.+) durumunu değiştir$/, '{name} durumunu değiştir', ['name']],
  [/^Oturum\/kurulum doğrulanamadı: (.+) Sayfayı yenileyin veya çıkış yapın\.$/, 'Oturum/kurulum doğrulanamadı: {error} Sayfayı yenileyin veya çıkış yapın.', ['error']],
  [/^Çıkış tamamlanamadı: (.+)$/, 'Çıkış tamamlanamadı: {error}', ['error']]
];
export function translateText(source) {
  if (dictionaries[language][source]) return t(source);
  for (const [expression, key, names] of patterns) {
    const match = source.match(expression);
    if (match) return t(key, Object.fromEntries(names.map((name,i) => [name, name === 'error' ? translateText(match[i+1]) : match[i+1]])));
  }
  return source;
}

let observer, initialised = false, callbacks = [];
const originals = new WeakMap();
const ignore = 'script,style,textarea,[data-no-i18n],[data-company],[data-address],.row-name,.row-category,.card-color,.description,.product-card h3,#detail-title,#admin-email';
const attributeNames = ['placeholder','aria-label','title'];
function translateRecord(node, key, current, write) {
  const records = originals.get(node) || {};
  const previous = records[key];
  const source = previous && current === previous.output ? previous.source : current;
  const trimmed = source.trim();
  const translated = translateText(trimmed);
  const output = source.replace(trimmed, translated);
  records[key] = { source, output }; originals.set(node, records);
  if (current !== output) write(output);
}
function translateDOM() {
  observer?.disconnect();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.nodeValue.trim() || node.parentElement?.closest(ignore)) continue;
    translateRecord(node,'text',node.nodeValue,value => { node.nodeValue = value; });
  }
  document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el => {
    if (el.closest('[data-no-i18n]')) return;
    attributeNames.forEach(key => {
      if (el.hasAttribute(key)) translateRecord(el,key,el.getAttribute(key),value => el.setAttribute(key,value));
    });
  });
  observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributeNames});
}
function applyLanguage() {
  document.documentElement.lang = language;
  document.documentElement.dir = ['ar','fa','he','ckb'].includes(language) ? 'rtl' : 'ltr';
  const title = location.pathname.startsWith('/admin') ? t('YÖNETİM PANELİ') : t('Ürün kataloğu');
  document.title = `SAYDER SUNİ DERİ — ${title}`;
  const select = document.querySelector('#language-select'); if (select) select.value = language;
  callbacks.forEach(callback => callback());
  translateDOM();
}
export function onLanguageChange(callback) { callbacks.push(callback); }
export function initI18n() {
  if (initialised || typeof document === 'undefined') return;
  initialised = true;
  observer = new MutationObserver(translateDOM);
  const select = document.querySelector('#language-select');
  if (select) {
    select.innerHTML = Object.entries(supportedLanguages).map(([code,[name]]) => `<option value="${code}" lang="${code}" dir="auto">${name}</option>`).join('');
    select.addEventListener('change',()=>{
      language = select.value;
      try { localStorage.setItem('sayder-language',language); } catch {}
      // Keep explicitly language-linked URLs consistent without reloading forms.
      const url = new URL(location.href);
      if (url.searchParams.has('lang')) { url.searchParams.set('lang',language); history.replaceState(null,'',url); }
      applyLanguage();
    });
  }
  applyLanguage();
}
