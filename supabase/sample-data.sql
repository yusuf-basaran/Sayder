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
