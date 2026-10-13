-- Proje: hhfnxebtbpsttdsnplgd / SAYDER SUNİ DERİ
-- SQL Editor > New query > tüm dosyayı yapıştır > Run.

-- Yeni Supabase projesinde SQL Editor > Run. Bu script mevcut tabloları dönüştürmez.
-- Tekrar çalıştırılabilir; aynı isimli uygulama politikalarını yeniden oluşturur.
begin;
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  product_code text not null unique default gen_random_uuid()::text check (length(trim(product_code)) between 1 and 60),
  category_id uuid not null references public.categories(id) on delete restrict,
  dimensions jsonb not null,
  material text not null default '' check (length(material) <= 500),
  color text not null default '' check (length(color) <= 100),
  stock_quantity numeric(12,2) not null default 0 check (stock_quantity >= 0 and stock_quantity <> 'NaN'::numeric),
  stock_unit text not null default 'metre' check (stock_unit in ('metre', 'rulo', 'adet')),
  is_sample boolean not null default false,
  sample_image_index smallint check (sample_image_index between 0 and 5),
  color_options text[] not null default '{}',
  image_url text not null default '' check (image_url = '' or image_url ~ '^https://'),
  description text not null default '' check (length(description) <= 10000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  search_text text generated always as (
    name || ' ' || product_code || ' ' || color || ' ' || material || ' ' ||
    coalesce(dimensions->>'width_cm', '') || ' cm ' ||
    coalesce(dimensions->>'thickness_mm', '') || ' mm ' ||
    coalesce(dimensions->>'roll_length_m', '') || ' m'
  ) stored,
  constraint valid_dimensions check (
    case when jsonb_typeof(dimensions) = 'object'
      and jsonb_typeof(dimensions->'width_cm') = 'number'
      and jsonb_typeof(dimensions->'thickness_mm') = 'number'
      and jsonb_typeof(dimensions->'roll_length_m') = 'number'
      and dimensions ?& array['width_cm', 'thickness_mm', 'roll_length_m']
    then (dimensions->>'width_cm')::numeric > 0
      and (dimensions->>'thickness_mm')::numeric > 0
      and (dimensions->>'roll_length_m')::numeric > 0
    else false end
  )
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_created_idx
  on public.products(created_at desc, id desc) where is_active;
create index if not exists products_created_idx on public.products(created_at desc, id desc);
-- Başlangıç kataloğu için ILIKE; büyük kataloglarda pg_trgm GIN eklenebilir.
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
revoke all on public.admin_users, public.categories, public.products from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products to anon;
grant select on public.admin_users to authenticated;
grant select, insert, update, delete on public.categories, public.products to authenticated;

-- Admin listesi yalnız SQL Editor / güvenilir sunucu tarafından değiştirilebilir.
drop policy if exists admin_read_self on public.admin_users;
create policy admin_read_self on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select to anon, authenticated
  using (true);
drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories for all to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select to anon, authenticated
  using (is_active = true);
drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products for all to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

-- Public bucket: dosya URL'sini bilen herkes okuyabilir; ürünün pasifliği dosyayı gizlemez.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists product_images_admin_all on storage.objects;
create policy product_images_admin_all on storage.objects for all to authenticated
  using (bucket_id = 'product-images' and exists (
    select 1 from public.admin_users where user_id = (select auth.uid())))
  with check (bucket_id = 'product-images' and exists (
    select 1 from public.admin_users where user_id = (select auth.uid())));
commit;

-- Authentication > Users'tan e-posta/şifre kullanıcısını oluşturduktan sonra,
-- aşağıdaki sorguyu e-postayı değiştirerek AYRICA çalıştırın:
-- insert into public.admin_users(user_id)
-- select id from auth.users where lower(email) = lower('admin@firmaniz.com')
-- on conflict (user_id) do nothing;

-- İSTEĞE BAĞLI: setup.sql sonrası SQL Editor’de çalıştırın. Gerçek stok değildir.
-- Panelde örnekleri düzenleyebilir veya silebilirsiniz. Yeniden çalıştırmak silinen örnekleri geri ekler.
begin;
insert into public.categories(name,slug) values
('Döşemelik suni deri','dosemelik'),
('Oto döşemelik','oto'),
('Kapitone','kapitone'),
('Oto tavanlığı','tavanlik')
on conflict(slug) do nothing;
insert into public.products(name,product_code,category_id,dimensions,material,color,color_options,stock_quantity,stock_unit,is_sample,sample_image_index,description)
select 'Soft Suni Deri','ORNEK-SYD-101',id,'{"width_cm":140,"thickness_mm":0.9,"roll_length_m":30}'::jsonb,'PU · İnce desen','Krem',array['Krem'],125,'metre',true,0,'Önizleme için örnek suni deri kaydıdır. Görsel, ölçü ve stok miktarları temsilidir. Gerçek ürün bilgileri yönetim panelinden girilecektir.'
from public.categories where slug='dosemelik'
on conflict(product_code) do nothing;
insert into public.products(name,product_code,category_id,dimensions,material,color,color_options,stock_quantity,stock_unit,is_sample,sample_image_index,description)
select 'Nappa Suni Deri','ORNEK-SYD-102',id,'{"width_cm":140,"thickness_mm":1.1,"roll_length_m":30}'::jsonb,'PU · Yumuşak doku','Taba',array['Taba'],85,'metre',true,1,'Önizleme için örnek suni deri kaydıdır. Görsel, ölçü ve stok miktarları temsilidir. Gerçek ürün bilgileri yönetim panelinden girilecektir.'
from public.categories where slug='dosemelik'
on conflict(product_code) do nothing;
insert into public.products(name,product_code,category_id,dimensions,material,color,color_options,stock_quantity,stock_unit,is_sample,sample_image_index,description)
select 'Oto Suni Deri','ORNEK-SYD-103',id,'{"width_cm":150,"thickness_mm":1.2,"roll_length_m":25}'::jsonb,'PVC · Döşemelik','Siyah',array['Siyah'],210,'metre',true,2,'Önizleme için örnek suni deri kaydıdır. Görsel, ölçü ve stok miktarları temsilidir. Gerçek ürün bilgileri yönetim panelinden girilecektir.'
from public.categories where slug='oto'
on conflict(product_code) do nothing;
insert into public.products(name,product_code,category_id,dimensions,material,color,color_options,stock_quantity,stock_unit,is_sample,sample_image_index,description)
select 'Soft Suni Deri','ORNEK-SYD-104',id,'{"width_cm":140,"thickness_mm":0.9,"roll_length_m":30}'::jsonb,'PU · İnce desen','Haki',array['Haki'],42,'metre',true,3,'Önizleme için örnek suni deri kaydıdır. Görsel, ölçü ve stok miktarları temsilidir. Gerçek ürün bilgileri yönetim panelinden girilecektir.'
from public.categories where slug='dosemelik'
on conflict(product_code) do nothing;
insert into public.products(name,product_code,category_id,dimensions,material,color,color_options,stock_quantity,stock_unit,is_sample,sample_image_index,description)
select 'Nappa Suni Deri','ORNEK-SYD-105',id,'{"width_cm":140,"thickness_mm":1.1,"roll_length_m":30}'::jsonb,'PU · Yumuşak doku','Bordo',array['Bordo'],18.5,'metre',true,4,'Önizleme için örnek suni deri kaydıdır. Görsel, ölçü ve stok miktarları temsilidir. Gerçek ürün bilgileri yönetim panelinden girilecektir.'
from public.categories where slug='dosemelik'
on conflict(product_code) do nothing;
insert into public.products(name,product_code,category_id,dimensions,material,color,color_options,stock_quantity,stock_unit,is_sample,sample_image_index,description)
select 'Oto Suni Deri','ORNEK-SYD-106',id,'{"width_cm":150,"thickness_mm":1.2,"roll_length_m":25}'::jsonb,'PVC · Döşemelik','Gri',array['Gri'],0,'metre',true,5,'Önizleme için örnek suni deri kaydıdır. Görsel, ölçü ve stok miktarları temsilidir. Gerçek ürün bilgileri yönetim panelinden girilecektir.'
from public.categories where slug='oto'
on conflict(product_code) do nothing;
insert into public.products(name,product_code,category_id,dimensions,material,color,color_options,stock_quantity,stock_unit,is_sample,sample_image_index,description)
select 'Nappa Suni Deri','ORNEK-SYD-107',id,'{"width_cm":140,"thickness_mm":1.1,"roll_length_m":30}'::jsonb,'PU · Yumuşak doku','Krem',array['Krem'],64,'metre',true,0,'Önizleme için örnek suni deri kaydıdır. Görsel, ölçü ve stok miktarları temsilidir. Gerçek ürün bilgileri yönetim panelinden girilecektir.'
from public.categories where slug='dosemelik'
on conflict(product_code) do nothing;
insert into public.products(name,product_code,category_id,dimensions,material,color,color_options,stock_quantity,stock_unit,is_sample,sample_image_index,description)
select 'Oto Suni Deri','ORNEK-SYD-108',id,'{"width_cm":150,"thickness_mm":1.2,"roll_length_m":25}'::jsonb,'PVC · Döşemelik','Taba',array['Taba'],96,'metre',true,1,'Önizleme için örnek suni deri kaydıdır. Görsel, ölçü ve stok miktarları temsilidir. Gerçek ürün bilgileri yönetim panelinden girilecektir.'
from public.categories where slug='oto'
on conflict(product_code) do nothing;
insert into public.products(name,product_code,category_id,dimensions,material,color,color_options,stock_quantity,stock_unit,is_sample,sample_image_index,description)
select 'Soft Suni Deri','ORNEK-SYD-109',id,'{"width_cm":140,"thickness_mm":0.9,"roll_length_m":30}'::jsonb,'PU · İnce desen','Siyah',array['Siyah'],0,'metre',true,2,'Önizleme için örnek suni deri kaydıdır. Görsel, ölçü ve stok miktarları temsilidir. Gerçek ürün bilgileri yönetim panelinden girilecektir.'
from public.categories where slug='dosemelik'
on conflict(product_code) do nothing;
commit;

-- Tüm örnek ürünleri topluca kaldırmak isterseniz SQL Editor’de ayrıca çalıştırın:
-- delete from public.products where is_sample = true;


-- SAYDER yönetici hesabını yetkilendir. Hesap Authentication > Users'ta bulunmalıdır.
do $$
declare target_user uuid;
begin
  select id into target_user from auth.users
  where lower(email) = lower('sayder@sunideri.com');
  if target_user is null then
    raise exception 'Önce Authentication > Users bölümünde sayder@sunideri.com hesabını oluşturun.';
  end if;
  insert into public.admin_users(user_id) values(target_user)
  on conflict(user_id) do nothing;
end $$;

select u.email, a.user_id as admin_id
from public.admin_users a join auth.users u on u.id=a.user_id
where lower(u.email)=lower('sayder@sunideri.com');
