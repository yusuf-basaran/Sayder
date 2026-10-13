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
  category_id uuid not null references public.categories(id) on delete restrict,
  dimensions jsonb not null,
  material text not null default '' check (length(material) <= 500),
  color_options text[] not null default '{}',
  image_url text not null default '' check (image_url = '' or image_url ~ '^https://'),
  description text not null default '' check (length(description) <= 10000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  search_text text generated always as (
    name || ' ' || material || ' ' ||
    coalesce(dimensions->>'width', '') || 'x' ||
    coalesce(dimensions->>'depth', '') || 'x' ||
    coalesce(dimensions->>'height', '')
  ) stored,
  constraint valid_dimensions check (
    case when jsonb_typeof(dimensions) = 'object'
      and jsonb_typeof(dimensions->'width') = 'number'
      and jsonb_typeof(dimensions->'depth') = 'number'
      and jsonb_typeof(dimensions->'height') = 'number'
      and dimensions ?& array['width', 'depth', 'height']
    then (dimensions->>'width')::numeric > 0
      and (dimensions->>'depth')::numeric > 0
      and (dimensions->>'height')::numeric > 0
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
