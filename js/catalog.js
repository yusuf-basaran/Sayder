import { supabase, configured, applyCompany, company, whatsappLink } from './supabaseClient.js';
import { $, escapeHTML as esc, stockLabel, productMedia, searchPattern, wireDialog } from './utils.js';
applyCompany(); document.title = `${company.name} — Ürün kataloğu`; $('#year').textContent = new Date().getFullYear();
const grid = $('#products'), dialog = $('#product-dialog'); wireDialog(dialog);
const pageSize = 12;
let category = '', term = '', offset = 0, total = 0, version = 0, stockOnly = false, sort = 'newest';
let controller, products = [], loading = false, searchTimer;
function notice(message = '') { $('#notice').textContent = message; $('#notice').hidden = !message; }
function contact(product, className = 'card-link') {
  const href = whatsappLink(product);
  return href ? `<a class="${className}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">Ürün hakkında bilgi al <span>↗</span></a>`
    : `<span class="${className} muted">Bilgi için bizi arayın</span>`;
}
function renderCards() {
  grid.innerHTML = products.length ? products.map(p => `<article class="product-card"><div class="product-visual">
    <button class="product-image-button" data-product="${esc(p.id)}" aria-label="${esc(p.product_code)} ${esc(p.name)} detaylarını aç">${productMedia(p)}<span class="image-code">${esc(p.product_code)}</span><span class="image-expand" aria-hidden="true">↗</span></button></div>
    <div class="card-body"><p class="card-category">${esc(p.categories?.name || 'Suni deri')}</p><h3><button data-product="${esc(p.id)}">${esc(p.name)}</button></h3>
    <p class="card-color">${esc(p.color || p.color_options?.join(', ') || 'Renk bilgisi yok')}</p>
    <div class="card-specs"><span class="spec-chip">${esc(p.dimensions.width_cm)} cm en</span><span class="spec-chip">${esc(p.dimensions.thickness_mm)} mm</span><span class="spec-chip">${esc(p.dimensions.roll_length_m)} m rulo</span></div>
    <div class="card-stock"><span class="stock-label ${Number(p.stock_quantity) > 0 ? '' : 'empty'}">${Number(p.stock_quantity) > 0 ? 'Stokta' : 'Stok tükendi'}</span><strong class="stock-amount">${esc(stockLabel(p))}</strong></div></div>${contact(p)}</article>`).join('')
    : (term || category || stockOnly
      ? '<p class="empty-state">Aramanıza uygun ürün bulunamadı.<br>Arama kelimesini veya filtreleri değiştirebilirsiniz.</p>'
      : '<p class="empty-state">Henüz ürün eklenmedi.</p>');
  wireImages();
}
function wireImages() { document.querySelectorAll('#products img, #detail img').forEach(img => img.addEventListener('error', () => { img.src = '/placeholder.svg'; }, { once: true })); }
async function load(reset = false) {
  if (!reset && loading) return;
  controller?.abort(); controller = new AbortController(); const request = ++version;
  if (reset) { offset = 0; products = []; grid.innerHTML = ''; }
  loading = true; grid.setAttribute('aria-busy', 'true'); $('#retry').hidden = true; $('#load-more').disabled = true;
  $('#result-count').textContent = 'Ürünler yükleniyor…';
  try {
    let data, count;
    let query = supabase.from('products').select('*,categories(name)', { count: 'exact' }).eq('is_active', true)
      .order(sort === 'name' ? 'name' : 'created_at', { ascending: sort === 'name' }).order('id', { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (category) query = query.eq('category_id', category);
    if (stockOnly) query = query.gt('stock_quantity', 0);
    if (term) query = query.ilike('search_text', searchPattern(term));
    const result = await query.abortSignal(controller.signal); if (result.error) throw result.error;
    ({ data, count } = result);
    if (request !== version) return;
    products.push(...data); offset += data.length; total = count || 0;
    renderCards(); $('#result-count').textContent = `${total} ürün ${offset < total ? `· ${offset} gösteriliyor` : 'listeleniyor'}`;
    $('#load-more').hidden = offset >= total; notice();
  } catch {
    if (request !== version) return;
    notice('Ürünler yüklenemedi. Bağlantınızı ve Supabase kurulumunu kontrol edip tekrar deneyin.');
    $('#result-count').textContent = 'Bağlantı kurulamadı'; $('#retry').hidden = false;
  } finally {
    if (request === version) { loading = false; grid.setAttribute('aria-busy', 'false'); $('#load-more').disabled = false; }
  }
}
function openDetail(p) {
  $('#detail').innerHTML = `<div class="detail-grid"><div class="detail-media">${productMedia(p)}</div><div class="detail-copy"><p class="eyebrow">${esc(p.categories?.name || 'SUNİ DERİ')}</p><h2 id="detail-title">${esc(p.name)}</h2><p class="detail-code">Ürün kodu: ${esc(p.product_code)}</p><div class="detail-stock"><span>${p.stock_quantity > 0 ? 'Kalan stok' : 'Stok tükendi'}</span><strong>${esc(stockLabel(p))}</strong></div><dl class="technical"><div><dt>Renk</dt><dd>${esc(p.color || p.color_options?.join(', '))}</dd></div><div><dt>En</dt><dd>${esc(p.dimensions.width_cm)} cm</dd></div><div><dt>Kalınlık</dt><dd>${esc(p.dimensions.thickness_mm)} mm</dd></div><div><dt>Rulo uzunluğu</dt><dd>${esc(p.dimensions.roll_length_m)} metre</dd></div><div><dt>Malzeme</dt><dd>${esc(p.material)}</dd></div></dl><p class="description mb-5">${esc(p.description)}</p>${contact(p, 'button')}</div></div>`;
  wireImages(); if (!dialog.open) dialog.showModal();
  const url = new URL(location.href); url.pathname = '/'; url.searchParams.set('product', p.id); history.replaceState(null, '', url);
}
dialog.addEventListener('close', () => { const url = new URL(location.href); url.pathname = '/'; url.searchParams.delete('product'); history.replaceState(null, '', url); });
grid.addEventListener('click', e => {
  const button = e.target.closest('[data-product]'); if (button) { const p = products.find(p => p.id === button.dataset.product); if (p) openDetail(p); }
});
$('#categories').addEventListener('click', e => {
  const button = e.target.closest('[data-category]'); if (!button) return;
  category = button.dataset.category; $('#categories').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button))); load(true);
});
$('#search').addEventListener('input', () => {
  controller?.abort(); ++version; loading = false; clearTimeout(searchTimer);
  term = $('#search').value.trim(); $('#load-more').hidden = true; searchTimer = setTimeout(() => load(true), 250);
});
$('#in-stock').addEventListener('change', () => { stockOnly = $('#in-stock').checked; load(true); });
$('#sort').addEventListener('change', () => { sort = $('#sort').value; load(true); });
$('#load-more').addEventListener('click', () => load()); $('#retry').addEventListener('click', () => start());
async function start() {
  try {
    if (!configured) throw new Error('config');
    const result = await supabase.from('categories').select('id,name,slug').order('name');
    if (result.error) throw result.error;
    $('#categories').innerHTML = [{ id: '', name: 'Tüm ürünler' }, ...result.data].map(c => `<button class="category-tab" data-category="${esc(c.id)}" aria-pressed="${c.id === category}"><span>${esc(c.name)}</span><span class="tab-arrow" aria-hidden="true">→</span></button>`).join('');
    await load(true);
    const id = new URLSearchParams(location.search).get('product') || (location.pathname.startsWith('/urun/') ? location.pathname.split('/')[2] : '');
    if (id) {
      const p = (/^[0-9a-f-]{36}$/i.test(id) ? (await supabase.from('products').select('*,categories(name)').eq('id', id).eq('is_active', true).maybeSingle()).data : null);
      if (p) openDetail(p); else notice('Bu ürün bulunamadı veya yayından kaldırıldı.');
    }
  } catch {
    notice(configured ? 'Kategoriler yüklenemedi. Tekrar deneyin.' : 'Katalog henüz bağlanmadı. Supabase ortam değişkenleri tanımlanmalıdır.');
    grid.setAttribute('aria-busy', 'false'); $('#result-count').textContent = 'Katalog kullanılamıyor'; $('#retry').hidden = false;
  }
}
start();
