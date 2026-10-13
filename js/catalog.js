import { supabase, configured, demoMode, applyCompany, company, whatsappLink } from './supabaseClient.js';
import { $, escapeHTML as esc, safeImage, sizeLabel, searchPattern, wireDialog } from './utils.js';

applyCompany();
document.title = `${company.name} — Ürün kataloğu`;
$('#year').textContent = new Date().getFullYear();
const grid = $('#products'), dialog = $('#product-dialog');
wireDialog(dialog);
const pageSize = 12;
let category = '', term = '', offset = 0, total = 0, version = 0;
let controller, demo, products = [], loading = false, searchTimer;
function notice(message = '') { $('#notice').textContent = message; $('#notice').hidden = !message; }
function contact(product, className = 'card-contact') {
  const href = whatsappLink(product);
  return href ? `<a class="${className}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">WhatsApp ile fiyat / bilgi al <span>↗</span></a>`
    : `<span class="${className} muted">Bilgi için iletişime geçin</span>`;
}
function renderCards() {
  grid.innerHTML = products.length ? products.map(p => `<article class="product-card">
    <button class="product-image-button" data-product="${esc(p.id)}" aria-label="${esc(p.name)} detaylarını aç"><img src="${esc(safeImage(p.image_url))}" alt="${esc(p.name)}" loading="lazy" decoding="async"><span class="image-arrow" aria-hidden="true">↗</span></button>
    <h3><button data-product="${esc(p.id)}">${esc(p.name)}</button></h3><span class="badge">${esc(p.categories?.name || 'Koleksiyon')}</span>
    <div class="card-info"><p>${esc(p.material)}</p><p>${esc(sizeLabel(p.dimensions))}</p></div>${contact(p)}</article>`).join('')
    : '<p class="empty-state">Bu aramaya uygun ürün bulunamadı. Başka bir kelime veya kategori deneyin.</p>';
  grid.querySelectorAll('img').forEach(img => img.addEventListener('error', () => { img.src = '/placeholder.svg'; }, { once: true }));
}
async function load(reset = false) {
  if (!reset && loading) return;
  controller?.abort(); controller = new AbortController();
  const request = ++version;
  if (reset) { offset = 0; products = []; grid.innerHTML = ''; }
  loading = true; grid.setAttribute('aria-busy', 'true');
  $('#retry').hidden = true; $('#load-more').disabled = true;
  $('#result-count').textContent = 'Ürünler yükleniyor…';
  try {
    let data, count;
    if (demo) {
      const filtered = demo.products.filter(p => (!category || p.category_id === category)
        && `${p.name} ${p.material} ${sizeLabel(p.dimensions)}`.toLocaleLowerCase('tr').includes(term.toLocaleLowerCase('tr')));
      data = filtered.slice(offset, offset + pageSize); count = filtered.length;
    } else {
      let query = supabase.from('products').select('id,name,category_id,dimensions,material,color_options,image_url,description,is_active,categories(name)', { count: 'exact' })
        .eq('is_active', true).order('created_at', { ascending: false }).order('id', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (category) query = query.eq('category_id', category);
      if (term) query = query.ilike('search_text', searchPattern(term));
      const result = await query.abortSignal(controller.signal);
      if (result.error) throw result.error;
      ({ data, count } = result);
    }
    if (request !== version) return;
    products.push(...data); offset += data.length; total = count || 0;
    renderCards(); $('#result-count').textContent = `${total} ürün · ${products.length} gösteriliyor`;
    $('#load-more').hidden = offset >= total;
    if (!demo) notice();
  } catch {
    if (request !== version) return;
    notice('Katalog yüklenemedi. İnternet bağlantısını ve Supabase kurulumunu kontrol edip tekrar deneyin.');
    $('#result-count').textContent = 'Bağlantı kurulamadı'; $('#retry').hidden = false;
  } finally {
    if (request === version) { loading = false; grid.setAttribute('aria-busy', 'false'); $('#load-more').disabled = false; }
  }
}
function openDetail(p) {
  $('#detail').innerHTML = `<div class="detail-grid"><img class="detail-image" src="${esc(safeImage(p.image_url))}" alt="${esc(p.name)}"><div class="detail-copy"><p class="eyebrow">${esc(p.categories?.name || 'KOLEKSİYON')}</p><h2 id="detail-title">${esc(p.name)}</h2><p class="description">${esc(p.description)}</p><dl class="technical"><div><dt>Ölçüler · G × D × Y</dt><dd>${esc(sizeLabel(p.dimensions))}</dd></div><div><dt>Materyal / kumaş</dt><dd>${esc(p.material || 'Belirtilmedi')}</dd></div><div><dt>Renk seçenekleri</dt><dd>${esc((p.color_options || []).join(', ') || 'Bilgi alınız')}</dd></div></dl>${contact(p, 'button')}</div></div>`;
  const img = $('#detail img'); img.addEventListener('error', () => { img.src = '/placeholder.svg'; }, { once: true });
  if (!dialog.open) dialog.showModal();
  const url = new URL(location.href); url.pathname = '/'; url.searchParams.set('product', p.id);
  history.replaceState(null, '', url);
}
dialog.addEventListener('close', () => {
  const url = new URL(location.href); url.pathname = '/'; url.searchParams.delete('product'); history.replaceState(null, '', url);
});
grid.addEventListener('click', e => {
  const button = e.target.closest('[data-product]');
  if (button) { const p = products.find(p => p.id === button.dataset.product); if (p) openDetail(p); }
});
$('#categories').addEventListener('click', e => {
  const button = e.target.closest('[data-category]'); if (!button) return;
  category = button.dataset.category;
  $('#categories').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  load(true);
});
$('#search').addEventListener('input', () => {
  // Eski sorgunun yeni arama sonucunun üstüne yazmasını hemen engelle.
  controller?.abort(); ++version; loading = false; clearTimeout(searchTimer);
  term = $('#search').value.trim(); $('#load-more').hidden = true;
  searchTimer = setTimeout(() => load(true), 250);
});
$('#load-more').addEventListener('click', () => load());
$('#retry').addEventListener('click', () => start());
async function start() {
  try {
    if (demoMode) { demo = await import('./demo.js'); notice('Tasarım önizlemesi: örnek ürünler gösteriliyor.'); }
    else if (!configured) throw new Error('config');
    const result = demo ? { data: demo.categories } : await supabase.from('categories').select('id,name,slug').order('name');
    if (result.error) throw result.error;
    $('#categories').innerHTML = [{ id: '', name: 'Tüm ürünler' }, ...result.data].map(c =>
      `<button class="category-tab" data-category="${esc(c.id)}" aria-pressed="${c.id === category}">${esc(c.name)}</button>`).join('');
    await load(true);
    const id = new URLSearchParams(location.search).get('product') || (location.pathname.startsWith('/urun/') ? location.pathname.split('/')[2] : '');
    if (id) {
      const p = demo ? demo.products.find(p => p.id === id) : (/^[0-9a-f-]{36}$/i.test(id) ? (await supabase.from('products').select('*,categories(name)').eq('id', id).eq('is_active', true).maybeSingle()).data : null);
      if (p) openDetail(p); else notice('Bu ürün bulunamadı veya yayından kaldırıldı.');
    }
  } catch {
    notice(configured ? 'Kategoriler yüklenemedi. Tekrar deneyin.' : 'Katalog henüz bağlanmadı. VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlanmalıdır.');
    grid.setAttribute('aria-busy', 'false'); $('#result-count').textContent = 'Katalog kullanılamıyor'; $('#retry').hidden = false;
  }
}
start();
