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
  name: env.VITE_COMPANY_NAME || 'Atölye Mobilya',
  email: env.VITE_COMPANY_EMAIL || 'info@example.com',
  address: env.VITE_COMPANY_ADDRESS || 'Firma adresinizi tanımlayın',
  hours: env.VITE_WORKING_HOURS || 'Pzt–Cmt 09.00–18.00',
  whatsapp: (env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')
};
export function whatsappLink(product) {
  if (!/^\d{10,15}$/.test(company.whatsapp)) return null;
  const url = product ? `${location.origin}/?product=${encodeURIComponent(product.id)}` : location.origin;
  const message = product ? `Merhaba, ${product.name} hakkında fiyat ve bilgi almak istiyorum. ${url}`
    : `Merhaba, ürünleriniz hakkında bilgi almak istiyorum. ${url}`;
  return `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(message)}`;
}
export function applyCompany() {
  document.querySelectorAll('[data-company]').forEach(el => { el.textContent = company.name; });
  document.querySelectorAll('[data-address]').forEach(el => { el.textContent = company.address; });
  document.querySelectorAll('[data-hours]').forEach(el => { el.textContent = company.hours; });
  document.querySelectorAll('[data-email]').forEach(el => {
    el.textContent = company.email; el.href = `mailto:${company.email}`;
  });
  document.querySelectorAll('[data-whatsapp]').forEach(el => {
    const href = whatsappLink();
    if (href) { el.href = href; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
    else { el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true'); el.title = 'WhatsApp numarası henüz tanımlanmadı'; }
  });
}
