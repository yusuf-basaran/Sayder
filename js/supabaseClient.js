import { createClient } from '@supabase/supabase-js';
const env = import.meta.env;
export const demoMode = env.VITE_DEMO_MODE === 'true';
const url = env.VITE_SUPABASE_URL || '';
const key = env.VITE_SUPABASE_ANON_KEY || '';
export const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)
  && key.length > 20 && !key.startsWith('YOUR_');
// Anon/publishable key public'tir. Yetkilendirme SQL RLS ile yapılır.
// service_role veya sb_secret_ anahtarını hiçbir VITE_ değişkenine koymayın.
export const supabase = configured ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
}) : null;
export const company = {
  name: env.VITE_COMPANY_NAME || 'SAYDER SUNİ DERİ',
  email: env.VITE_COMPANY_EMAIL || '',
  phone: env.VITE_COMPANY_PHONE || '0530 360 63 63',
  address: env.VITE_COMPANY_ADDRESS || 'Büyük Çınar Sok. No:45A, Bayrampaşa / İstanbul',
  hours: env.VITE_WORKING_HOURS || 'Pzt–Cum 08.00–18.00 · Cmt 08.00–15.00 · Pazar kapalı',
  whatsapp: (env.VITE_WHATSAPP_NUMBER ?? '905303606363').replace(/\D/g, ''),
  map: 'https://yandex.com.tr/maps/-/CXBIr8Ym',
  facebook: 'https://www.facebook.com/groups/877165027323660',
  instagram: 'https://www.instagram.com/saydersunideri/'
};
export function whatsappLink(product) {
  if (!/^\d{10,15}$/.test(company.whatsapp)) return null;
  const url = product ? `${location.origin}/?product=${encodeURIComponent(product.id)}` : location.origin;
  const message = product ? `Merhaba, ${product.product_code} ${product.name} (${product.color || ''}) hakkında fiyat ve stok bilgisi almak istiyorum. ${url}`
    : `Merhaba, ürünleriniz hakkında bilgi almak istiyorum. ${url}`;
  return `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(message)}`;
}
export function applyCompany() {
  document.querySelectorAll('[data-company]').forEach(el => { el.textContent = company.name; });
  document.querySelectorAll('[data-address]').forEach(el => { el.textContent = company.address; });
  document.querySelectorAll('[data-hours]').forEach(el => { el.textContent = company.hours; });
  document.querySelectorAll('[data-email]').forEach(el => {
    el.hidden = !company.email; el.textContent = company.email; el.href = `mailto:${company.email}`;
  });
  document.querySelectorAll('[data-phone]').forEach(el => {
    // Metni açıkça telefon numarası olan öğelere yaz; "Bizi arayın" CTA'sını koru.
    if (/\d/.test(el.textContent)) el.textContent = company.phone;
    let phone = company.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = `90${phone.slice(1)}`;
    el.href = `tel:+${phone}`;
  });
  document.querySelectorAll('[data-map]').forEach(el => { el.href = company.map; });
  document.querySelectorAll('[data-facebook]').forEach(el => { el.href = company.facebook; });
  document.querySelectorAll('[data-instagram]').forEach(el => { el.href = company.instagram; });
  document.querySelectorAll('[data-whatsapp]').forEach(el => {
    const href = whatsappLink();
    if (href) { el.href = href; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
    else { el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true'); el.title = 'WhatsApp numarası henüz tanımlanmadı'; }
  });
}
