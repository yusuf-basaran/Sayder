import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { escapeHTML, safeImage, slugify, searchPattern } from '../js/utils.js';

test('Supabase şeması ve RLS: anon, normal kullanıcı, admin, iptal edilmiş admin', async () => {
  const db = new PGlite();
  const admin = '00000000-0000-4000-8000-000000000001';
  const user = '00000000-0000-4000-8000-000000000002';
  const category = '00000000-0000-4000-8000-000000000003';
  // Yalnız test harness: Supabase'in Auth/Storage şemalarını simüle eder.
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, storage to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table storage.buckets(id text primary key, name text, public boolean,
      file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant select, insert, update, delete on storage.objects to authenticated;
    insert into auth.users values ('${admin}','admin@example.com'),('${user}','user@example.com');
  `);
  const sql = await readFile(new URL('../supabase/setup.sql', import.meta.url), 'utf8');
  await db.exec(sql); await db.exec(sql); // tekrar çalıştırılabilirlik
  await db.query('insert into public.admin_users(user_id) values ($1)', [admin]);
  await db.query("insert into public.categories(id,name,slug) values ($1,'Oturma','oturma')", [category]);
  await db.query(`insert into public.products(name,category_id,dimensions,is_active) values
    ('Aktif',$1,'{"width":100,"depth":80,"height":75}',true),
    ('Pasif',$1,'{"width":100,"depth":80,"height":75}',false)`, [category]);
  async function as(role, id, fn) {
    await db.exec('begin');
    try {
      await db.query("select set_config('request.jwt.claim.sub', $1, true)", [id || '']);
      await db.exec(`set local role ${role}`);
      await fn();
    } finally { await db.exec('rollback'); }
  }
  await as('anon', null, async () => {
    assert.equal((await db.query('select * from public.products')).rows.length, 1);
    assert.equal((await db.query('select * from public.categories')).rows.length, 1);
    await assert.rejects(db.query("insert into public.categories(name,slug) values ('X','x')"));
  });
  await as('authenticated', user, async () => {
    assert.equal((await db.query('select * from public.admin_users')).rows.length, 0);
    assert.equal((await db.query('select * from public.products')).rows.length, 1);
    assert.equal((await db.query("update public.products set name='Hack' returning id")).rows.length, 0);
    assert.equal((await db.query('delete from public.products returning id')).rows.length, 0);
  });
  await as('authenticated', user, async () => {
    await assert.rejects(db.query("insert into public.categories(name,slug) values ('Hack','hack')"));
  });
  await as('authenticated', user, async () => {
    await assert.rejects(db.query(`insert into public.products(name,category_id,dimensions)
      values ('Hack',$1,'{"width":40,"depth":40,"height":50}')`, [category]));
  });
  await as('authenticated', user, async () => {
    await assert.rejects(db.query('insert into public.admin_users(user_id) values ($1)', [user]));
  });
  await as('authenticated', user, async () => {
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('product-images','hack.jpg')"));
  });
  await as('authenticated', admin, async () => {
    assert.equal((await db.query('select * from public.products')).rows.length, 2);
    assert.equal((await db.query("update public.products set material='Meşe' returning id")).rows.length, 2);
    await db.query("insert into public.categories(name,slug) values ('Masa','masa')");
    await db.query(`insert into public.products(name,category_id,dimensions)
      values ('Yeni',$1,'{"width":40,"depth":40,"height":50}')`, [category]);
    assert.equal((await db.query("delete from public.products where name='Yeni' returning id")).rows.length, 1);
    await db.query("insert into storage.objects(bucket_id,name) values ('product-images','admin.jpg')");
    assert.equal((await db.query('delete from storage.objects returning id')).rows.length, 1);
  });
  await as('authenticated', admin, async () => {
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('other','admin.jpg')"));
  });
  await as('authenticated', admin, async () => {
    await assert.rejects(db.query(`insert into public.products(name,category_id,dimensions)
      values ('Geçersiz',$1,'{"width":10,"depth":10}')`, [category]));
  });
  await as('authenticated', admin, async () => {
    await assert.rejects(db.query('delete from public.categories where id=$1', [category]));
  });
  await db.query('delete from public.admin_users where user_id=$1', [admin]);
  await as('authenticated', admin, async () => {
    assert.equal((await db.query('select * from public.products')).rows.length, 1);
    assert.equal((await db.query("update public.products set name='Revoked' returning id")).rows.length, 0);
  });
  await db.close();
});

test('XSS, güvenli görsel URL, Türkçe slug ve LIKE kaçışları', () => {
  assert.equal(escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(safeImage('javascript:alert(1)'), '/placeholder.svg');
  assert.equal(safeImage('https://example.com/a.jpg'), 'https://example.com/a.jpg');
  assert.equal(slugify('Çalışma & Ölçü Şöleni'), 'calisma-olcu-soleni');
  assert.equal(searchPattern('100%_'), '%100\\%\\_%');
});
