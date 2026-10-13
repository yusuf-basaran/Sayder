export const categories = [
  { id: 'dosemelik', name: 'Döşemelik suni deri', slug: 'dosemelik' },
  { id: 'oto', name: 'Oto döşemelik', slug: 'oto' },
  { id: 'kapitone', name: 'Kapitone', slug: 'kapitone' },
  { id: 'tavanlik', name: 'Oto tavanlığı', slug: 'tavanlik' }
];
export const products = [
  ['101', 'Soft Suni Deri', 'dosemelik', 'Krem', 0, 140, 0.9, 30, 125, 'PU · İnce desen'],
  ['102', 'Nappa Suni Deri', 'dosemelik', 'Taba', 1, 140, 1.1, 30, 85, 'PU · Yumuşak doku'],
  ['103', 'Oto Suni Deri', 'oto', 'Siyah', 2, 150, 1.2, 25, 210, 'PVC · Döşemelik'],
  ['104', 'Soft Suni Deri', 'dosemelik', 'Haki', 3, 140, 0.9, 30, 42, 'PU · İnce desen'],
  ['105', 'Nappa Suni Deri', 'dosemelik', 'Bordo', 4, 140, 1.1, 30, 18.5, 'PU · Yumuşak doku'],
  ['106', 'Oto Suni Deri', 'oto', 'Gri', 5, 150, 1.2, 25, 0, 'PVC · Döşemelik'],
  ['107', 'Nappa Suni Deri', 'dosemelik', 'Krem', 0, 140, 1.1, 30, 64, 'PU · Yumuşak doku'],
  ['108', 'Oto Suni Deri', 'oto', 'Taba', 1, 150, 1.2, 25, 96, 'PVC · Döşemelik'],
  ['109', 'Soft Suni Deri', 'dosemelik', 'Siyah', 2, 140, 0.9, 30, 0, 'PU · İnce desen']
].map(([code, name, category_id, color, sample_image_index, width_cm, thickness_mm, roll_length_m, stock_quantity, material]) => ({
  id: `demo-${code}`, product_code: `SYD-${code}`, name, category_id, color,
  dimensions: { width_cm, thickness_mm, roll_length_m }, categories: categories.find(c => c.id === category_id),
  stock_quantity, stock_unit: 'metre', color_options: [color], material, image_url: '', sample_image_index,
  is_sample: true, is_active: true,
  description: 'Önizleme için örnek suni deri kaydıdır. Görsel, ölçü ve stok miktarları temsilidir. Gerçek ürün bilgileri yönetim panelinden girilecektir.'
}));
export const storageKey = 'sayder-hidden-samples-v1';
export function hiddenSamples() {
  try { const ids = JSON.parse(localStorage.getItem(storageKey) || '[]'); return Array.isArray(ids) ? ids : []; } catch { return []; }
}
export const visibleProducts = () => products.filter(p => !hiddenSamples().includes(p.id));
export function deleteSample(id) { localStorage.setItem(storageKey, JSON.stringify([...new Set([...hiddenSamples(), id])])); }
export function restoreSamples() { localStorage.removeItem(storageKey); }
