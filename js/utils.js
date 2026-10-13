export const $ = (selector) => document.querySelector(selector);
export const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
export function safeImage(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : '/placeholder.svg'; }
  catch { return '/placeholder.svg'; }
}
export const sizeLabel = (d = {}) => `${d.width_cm ?? '—'} cm en · ${d.thickness_mm ?? '—'} mm · ${d.roll_length_m ?? '—'} m rulo`;
export function stockLabel(product) {
  const amount = Number(product.stock_quantity || 0);
  return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(amount)} ${product.stock_unit || 'metre'}`;
}
export function productMedia(product) {
  const i = product.sample_image_index;
  if (product.is_sample && Number.isInteger(i) && i >= 0 && i <= 5 && !product.image_url)
    return `<div class="sample-swatch swatch-${i}" role="img" aria-label="${escapeHTML(product.name)} — örnek suni deri dokusu"></div>`;
  return `<img src="${escapeHTML(safeImage(product.image_url))}" alt="${escapeHTML(product.name)}" loading="lazy" decoding="async">`;
}
export function slugify(value) {
  return value.trim().toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's')
    .replace(/ğ/g, 'g').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
export const searchPattern = value => `%${value.trim().replace(/[\\%_]/g, '\\$&')}%`;
export function debounce(fn, ms = 250) {
  let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
export function wireDialog(dialog) {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
}
