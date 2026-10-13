import { supabase, configured, applyCompany } from './supabaseClient.js';
import { $, escapeHTML as esc, slugify, searchPattern, stockLabel, debounce, wireDialog } from './utils.js';
applyCompany();
const form = $('#product-form'), catForm = $('#category-form'), catDialog = $('#category-dialog');
wireDialog(catDialog);
const field = name => form.elements.namedItem(name);
const pageSize = 25;
let authorized = false, rows = [], categories = [], editing = null, catEditing = null;
let page = 0, search = '', total = 0, listVersion = 0, authVersion = 0, operation = false, dataReady = false;
function message(selector, text = '') { const el = $(selector); el.textContent = text; el.hidden = !text; }
function fail(error) {
  if (error?.code === '23505') return 'Ürün kodu veya kategori slug değeri zaten kullanılıyor. Farklı bir değer girin.';
  if (error?.code === '23503') return 'Bu kategori ürünlerde kullanılıyor. Önce ürünleri başka kategoriye taşıyın.';
  if (error?.code === '42501') return 'İşlem yetkisi yok. Yönetici atamasını kontrol edin.';
  return error?.message || 'İşlem tamamlanamadı. Tekrar deneyin.';
}
function resetForm() { editing = null; form.reset(); $('#form-title').textContent = 'Ürün ekle'; $('#save-product').textContent = 'Ürünü kaydet'; }
async function runOperation(fn, target = '#admin-message') {
  if (operation || !authorized) return;
  operation = true; message(target);
  // Tek seferde tek mutation; form / tablo / kategori kontrolleri aynı anda kilitlenir.
  const controls = [...document.querySelectorAll('#admin-view button, #admin-view input, #admin-view select, #admin-view textarea, #category-dialog button, #category-dialog input')];
  const disabled = controls.map(el => el.disabled);
  controls.forEach(el => { el.disabled = true; });
  try { await fn(); }
  catch (error) { message(target, fail(error)); }
  finally {
    controls.forEach((el, i) => { el.disabled = disabled[i]; });
    operation = false;
    $('#previous').disabled = page === 0;
    $('#next').disabled = (page + 1) * pageSize >= total;
  }
}
async function authorize(session) {
  const request = ++authVersion;
  authorized = false; dataReady = false; ++listVersion;
  $('#admin-view').hidden = true; $('#logout').hidden = !session;
  $('#login-view').hidden = true; message('#auth-status', 'Oturum kontrol ediliyor…');
  if (!session) {
    rows = []; $('#product-rows').innerHTML = ''; resetForm();
    if (catDialog.open) catDialog.close();
    $('#login-view').hidden = false; message('#auth-status'); return;
  }
  try {
    // getUser Auth sunucusunda kimliği kontrol eder. Asıl yazma koruması RLS'dir.
    const userResult = await supabase.auth.getUser(); if (userResult.error) throw userResult.error;
    const result = await supabase.from('admin_users').select('user_id').eq('user_id', userResult.data.user.id).maybeSingle();
    if (result.error) throw result.error;
    if (request !== authVersion) return;
    if (!result.data) { message('#auth-status', 'Bu hesap yönetici olarak yetkilendirilmemiş. Çıkış yapıp yetkili hesabı kullanın.'); return; }
    authorized = true; $('#admin-view').hidden = false;
    $('#admin-email').textContent = userResult.data.user.email; message('#auth-status');
    await loadCategories(); await loadRows();
    if (request === authVersion) dataReady = true;
  } catch (error) {
    if (request !== authVersion) return;
    authorized = false; $('#admin-view').hidden = true;
    message('#auth-status', `Oturum/kurulum doğrulanamadı: ${fail(error)} Sayfayı yenileyin veya çıkış yapın.`);
  }
}
async function loadCategories() {
  const result = await supabase.from('categories').select('id,name,slug').order('name');
  if (result.error) throw result.error;
  categories = result.data;
  const selected = field('category_id').value;
  field('category_id').innerHTML = '<option value="">Kategori seçin</option>' + categories.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
  field('category_id').value = selected;
  $('#category-list').innerHTML = categories.map(c => `<li><span>${esc(c.name)}<small class="block muted">${esc(c.slug)}</small></span><div class="flex gap-3"><button class="text-action" data-cat-edit="${esc(c.id)}">Düzenle</button><button class="text-action danger" data-cat-delete="${esc(c.id)}">Sil</button></div></li>`).join('');
}
async function loadRows() {
  const request = ++listVersion; $('#product-rows').setAttribute('aria-busy', 'true');
  let query = supabase.from('products').select('*,categories(name)', { count: 'exact' })
    .order('created_at', { ascending: false }).order('id', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
  if (search) query = query.ilike('search_text', searchPattern(search));
  try {
    const { data, count, error } = await query; if (error) throw error;
    if (request !== listVersion || !authorized) return;
    if (!data.length && page > 0) { --page; return loadRows(); }
    rows = data; total = count || 0;
    $('#product-rows').innerHTML = rows.length ? rows.map(p => `<tr><td><span class="row-name">${esc(p.name)}</span><span class="row-category">${esc(p.product_code)} · ${esc(p.color)}${p.is_sample ? ' · Örnek ürün' : ''}</span></td><td><strong>${esc(stockLabel(p))}</strong></td><td><button class="badge" data-toggle="${esc(p.id)}" aria-label="${esc(p.name)} durumunu değiştir" aria-pressed="${p.is_active}">${p.is_active ? '● Aktif' : '○ Pasif'}</button></td><td><div class="row-actions"><button class="text-action" data-edit="${esc(p.id)}">Düzenle</button><button class="text-action danger" data-delete="${esc(p.id)}">Sil</button></div></td></tr>`).join('')
      : '<tr><td colspan="4" class="muted py-10 text-center">Henüz ürün yok veya arama sonucu bulunamadı.</td></tr>';
    $('#page-info').textContent = `${count || 0} ürün · Sayfa ${page + 1}`;
    $('#previous').disabled = page === 0; $('#next').disabled = (page + 1) * pageSize >= (count || 0);
  } finally { if (request === listVersion) $('#product-rows').setAttribute('aria-busy', 'false'); }
}
$('#login-form').addEventListener('submit', async e => {
  e.preventDefault(); const button = e.submitter; button.disabled = true; message('#login-message');
  try {
    const f = e.target.elements;
    const { error } = await supabase.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
    if (error) throw error; f.password.value = '';
    // SIGNED_IN olayı authorize() çalıştırır.
  } catch { message('#login-message', 'Giriş yapılamadı. E-posta, şifre ve bağlantınızı kontrol edin.'); }
  finally { button.disabled = false; }
});
$('#logout').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) message('#auth-status', `Çıkış tamamlanamadı: ${fail(error)}`);
});
$('#reset-form').addEventListener('click', resetForm);
$('#new-product').addEventListener('click', () => { resetForm(); form.scrollIntoView({ behavior: 'smooth' }); field('name').focus(); });
form.addEventListener('submit', e => {
  e.preventDefault();
  // Disabled inputların değerleri de .elements üzerinden okunabilir.
  runOperation(async () => {
    const id = editing || crypto.randomUUID();
    const dimensions = Object.fromEntries(['width_cm', 'thickness_mm', 'roll_length_m'].map(k => [k, Number(field(k).value)]));
    if (Object.values(dimensions).some(n => !Number.isFinite(n) || n <= 0)) throw new Error('Ölçüler pozitif sayı olmalıdır.');
    const stock_quantity = Number(field('stock_quantity').value);
    if (!Number.isFinite(stock_quantity) || stock_quantity < 0) throw new Error('Stok miktarı sıfır veya pozitif sayı olmalıdır.');
    let image_url = field('image_url').value.trim(), uploadedPath;
    if (image_url && new URL(image_url).protocol !== 'https:') throw new Error('Görsel URL HTTPS olmalıdır.');
    const file = field('image_file').files[0];
    if (file) {
      const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
      if (!extensions[file.type] || file.size > 5242880 || !file.size) throw new Error('JPG, PNG, WebP veya AVIF seçin; sınır 5 MB.');
      // Rastgele isimler, eski görsellerin üzerine yazmayı ve cache çakışmasını önler.
      uploadedPath = `${id}/${crypto.randomUUID()}.${extensions[file.type]}`;
      const upload = await supabase.storage.from('product-images').upload(uploadedPath, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
      if (upload.error) throw upload.error;
      image_url = supabase.storage.from('product-images').getPublicUrl(uploadedPath).data.publicUrl;
    }
    const payload = { name: field('name').value.trim(), category_id: field('category_id').value, dimensions,
      product_code: field('product_code').value.trim(), color: field('color').value.trim(),
      stock_quantity, stock_unit: field('stock_unit').value,
      material: field('material').value.trim(), color_options: field('colors').value.split(',').map(c => c.trim()).filter(Boolean),
      image_url, description: field('description').value.trim(), is_active: field('is_active').checked,
      is_sample: field('is_sample').checked };
    const mutation = editing ? supabase.from('products').update(payload).eq('id', id) : supabase.from('products').insert({ id, ...payload });
    const { data, error } = await mutation.select('id').single();
    if (error || !data) {
      if (uploadedPath) {
        const cleanup = await supabase.storage.from('product-images').remove([uploadedPath]);
        if (cleanup.error) throw new Error(`${fail(error)} Yüklenen dosya silinemedi; Storage'da ${uploadedPath} yolunu kontrol edin.`);
      }
      throw error || new Error('Ürün bulunamadı veya işlem yetkisi kaldırıldı.');
    }
    resetForm(); page = 0; await loadRows(); message('#admin-message', 'Ürün kaydedildi.');
  });
});
$('#product-rows').addEventListener('click', e => {
  const button = e.target.closest('button'); if (!button || operation) return;
  const id = button.dataset.edit || button.dataset.delete || button.dataset.toggle;
  const p = rows.find(p => p.id === id); if (!p) return;
  if (button.dataset.edit) {
    resetForm(); editing = p.id;
    for (const k of ['name', 'product_code', 'color', 'category_id', 'material', 'image_url', 'description', 'stock_unit']) field(k).value = p[k] || '';
    field('stock_quantity').value = p.stock_quantity;
    field('is_sample').checked = p.is_sample;
    for (const k of ['width_cm', 'thickness_mm', 'roll_length_m']) field(k).value = p.dimensions[k];
    field('colors').value = p.color_options.join(', '); field('is_active').checked = p.is_active;
    $('#form-title').textContent = 'Ürünü düzenle'; $('#save-product').textContent = 'Değişiklikleri kaydet';
    form.scrollIntoView({ behavior: 'smooth' }); field('name').focus(); return;
  }
  if (button.dataset.delete && !confirm(`“${p.name}” kalıcı olarak silinsin mi?`)) return;
  runOperation(async () => {
    const query = button.dataset.delete ? supabase.from('products').delete().eq('id', id)
      : supabase.from('products').update({ is_active: !p.is_active }).eq('id', id);
    const { data, error } = await query.select('id').single(); if (error || !data) throw error || new Error('Ürün artık mevcut değil.');
    if (editing === id) resetForm(); await loadRows(); message('#admin-message', button.dataset.delete ? 'Ürün silindi.' : 'Yayın durumu güncellendi.');
  });
});
const reloadSearch = debounce(() => loadRows().catch(e => message('#admin-message', fail(e))));
$('#admin-search').addEventListener('input', () => { search = $('#admin-search').value.trim(); page = 0; ++listVersion; reloadSearch(); });
$('#previous').addEventListener('click', () => { if (page > 0) --page; loadRows().catch(e => message('#admin-message', fail(e))); });
$('#next').addEventListener('click', () => { ++page; loadRows().catch(e => message('#admin-message', fail(e))); });
function resetCategory() { catEditing = null; catForm.reset(); message('#category-message'); }
$('#open-category').addEventListener('click', () => { resetCategory(); catDialog.showModal(); });
$('#category-reset').addEventListener('click', resetCategory);
catForm.addEventListener('submit', e => {
  e.preventDefault(); runOperation(async () => {
    const name = catForm.elements.name.value.trim();
    const slug = catForm.elements.slug.value.trim() || slugify(name);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error('Geçerli bir slug girin (küçük Latin harfleri, rakam ve tire).');
    const query = catEditing ? supabase.from('categories').update({ name, slug }).eq('id', catEditing) : supabase.from('categories').insert({ name, slug });
    const result = await query.select('id').single(); if (result.error) throw result.error;
    await loadCategories(); await loadRows(); resetCategory(); message('#category-message', 'Kategori kaydedildi.');
  }, '#category-message');
});
$('#category-list').addEventListener('click', e => {
  const button = e.target.closest('button'); if (!button || operation) return;
  const c = categories.find(c => c.id === (button.dataset.catEdit || button.dataset.catDelete)); if (!c) return;
  if (button.dataset.catEdit) { catEditing = c.id; catForm.elements.name.value = c.name; catForm.elements.slug.value = c.slug; return; }
  if (!confirm(`“${c.name}” kategorisi silinsin mi?`)) return;
  runOperation(async () => {
    const result = await supabase.from('categories').delete().eq('id', c.id).select('id').single();
    if (result.error) throw result.error;
    await loadCategories(); resetCategory(); message('#category-message', 'Kategori silindi.');
  }, '#category-message');
});
if (!configured) {
  message('#auth-status', 'Önce VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ortam değişkenlerini tanımlayın.');
} else {
  // Auth callback içinde async Supabase çağrısı yapma: callback dışına planla.
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && !dataReady))
      setTimeout(() => authorize(session), 0);
  });
}
