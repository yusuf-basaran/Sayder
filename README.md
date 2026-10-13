# SAYDER SUNİ DERİ · Ürün ve stok kataloğu

Vanilla JavaScript ES Modules + HTML5 + derlenen Tailwind CSS, Supabase JS v2,
PostgreSQL/RLS/Auth/Storage ve Vercel. Vite yalnız geliştirme ve derleme aracıdır.
Firma bilgileri kullanıcı tarafından paylaşılan Yandex/Facebook sayfalarından alınmıştır.
Ürün görselleri, ürün kodları, ölçüler ve stok miktarları örnektir; gerçek kayıtlar panelden girilir.
GitHub hedefi: https://github.com/yusuf-basaran/Sayder

## 1. Önce SQL

Supabase projenizde SQL Editor'ü açın. `supabase/setup.sql` dosyasının **tamamını**
yapıştırıp Run'a basın. Bu, yeni proje için tek çalıştırmada tabloları, kısıtları,
indeksleri, RLS politikalarını ve `product-images` bucket'ını kurar.
Script tekrar çalıştırılabilir; mevcut eski bir şemayı migrate etmez.
Başka isimli, önceden tanımlanmış geniş erişimli politikalar varsa bunları ayrıca inceleyin;
PostgreSQL permissive politikaları OR ile birleştirir.

`categories` tablosunda is_active alanı istenmediği için tüm kategoriler okunabilir.
`products` tablosunda ziyaretçi ve normal kullanıcı sadece aktif satırları görür.
`authenticated` tek başına yönetici sayılmaz. Yönetici olmak için `admin_users`
listesinde bulunmak gerekir. Bu listeyi tarayıcı istemcileri değiştiremez.

## 2. İlk yöneticiyi oluşturun

1. Authentication > Users üzerinden e-posta/şifre kullanıcısı oluşturun; e-postasını
   doğrulayın. Şifreyi koda veya GitHub'a yazmayın.
2. Auth ayarlarında herkese açık kullanıcı kaydını kapatın. Uygulama zaten kayıt
   ekranı sunmaz; RLS kayıt açık kalsa bile sıradan kullanıcılara yazma yetkisi vermez.
3. SQL Editor'de e-postayı değiştirerek çalıştırın:

```sql
insert into public.admin_users(user_id)
select id from auth.users
where lower(email) = lower('admin@firmaniz.com')
on conflict (user_id) do nothing;

-- Sonuç bir satır olmalı; 0 satırsa kullanıcı henüz yok veya e-posta farklı.
select u.id, u.email from auth.users u
join public.admin_users a on a.user_id = u.id;
```

Admin atamasını kaldırmak için SQL Editor'de:

```sql
delete from public.admin_users
where user_id in (select id from auth.users where email = 'admin@firmaniz.com');
```

Sonraki veritabanı/Storage isteklerinde yetki düşer; mevcut ekrandaki veriler
bir sonraki istek veya sayfa yenilemesine kadar kalabilir.
Auth Site URL'yi yayınlanan alan adına, geliştirme redirect URL'sini
`http://localhost:5173` adresine ayarlayın. Supabase güvenlik danışmanlarını çalıştırın.

## 3. Yerelde çalıştırma

Node.js 22.12+ (tercihen Node 24) ve pnpm 11.25.0 gerekir.

```bash
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
```

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:

```bash
cp .env.example .env.local
```

`.env.local` içindeki `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerini
Supabase proje ayarlarından alın. Publishable key (`sb_publishable_...`) önerilir;
legacy anon key de desteklenir. **service_role / sb_secret_ kullanmayın.**
VITE_ değerleri derlenen tarayıcı paketinde görünür; şifre veya sunucu sırrı değildir.
Derleme yanlışlıkla service_role/secret key kullanılırsa durur.

`VITE_WHATSAPP_NUMBER` ülke kodu dahil yalnız rakamlardan oluşmalıdır (Türkiye: 90 + numara).
Tanımlanmazsa WhatsApp bağlantıları devre dışı görünür. Firma bilgilerini de doldurun.

```bash
pnpm dev
pnpm test
pnpm build
pnpm preview
```

Katalog `/`, yönetim `/admin.html` adresindedir. `file://` ile HTML açmayın;
ES Modules, import.meta.env ve CSS derlemesi geliştirme sunucusu gerektirir.
Çevre değişkenlerini değiştirince dev sunucusunu yeniden başlatın.

Supabase olmadan tasarımı görmek için `.env.local` içine `VITE_DEMO_MODE=true` yazıp
`pnpm dev` çalıştırın. Örnek kayıtlar açıkça işaretlenir; admin demo yazma yapmaz.
Production derlemesi demo modunda durur. Gerçek yayında `VITE_DEMO_MODE=false` kullanın.

## 4. Ürün ve kategori yönetimi

1. Yetkili e-posta/şifreyle giriş yapın.
2. Kategori ekle/düzenle penceresinden kategori oluşturun. Türkçe ad otomatik
   ASCII slug'a dönüşür; çakışmada farklı slug girin.
3. Ürün kodu ve rengi girin. Ölçüler: en (cm), kalınlık (mm), standart rulo uzunluğu (metre).
   Kalan stok ve birimi (metre/rulo/adet) ayrıdır; rulo uzunluğu kalan stok anlamına gelmez.
4. HTTPS görsel URL'si girin veya JPG/PNG/WebP/AVIF yükleyin (5 MB sınırı).
   İkisini girerseniz yüklenen dosya kullanılır.
5. Aktif ürün katalogda görünür. Pasif ürün sadece admin listesinde görünür.
6. Liste üzerinde düzenleme, yayın durumu değiştirme ve onaylı silme yapabilirsiniz.

Ürünlerde kullanılan kategori silinemez; önce ürünleri taşıyın. SQL foreign key bunu
zorunlu kılar. Hatalar kullanıcıya textContent ile gösterilir. Ürün metinleri HTML
olarak çalıştırılmaz; görsel URL'leri HTTPS ile sınırlandırılır.

Katalog 12, yönetim 25 ürünlük sunucu sayfalaması kullanır. Arama ürün adı,
ürün kodu, renk, materyal ve ölçü metnini ILIKE ile tarar; debounce 250 ms.
"Sadece stokta olanlar" filtresi stock_quantity > 0 koşulunu uygular.
Stok admin panelinden ürün düzenlenerek güncellenir; stok miktarı negatif olamaz.
Bu katalog sipariş/satış sistemi değildir; siparişle otomatik stok düşmez.
Bu filtreleme anlık arama etkileşimidir; Supabase Realtime aboneliği değildir.
Başka bir adminin değişikliklerini görmek için sayfayı yenileyin.
WhatsApp ürün linki `/?product=<uuid>` şeklindedir; listede yüklenmemiş ürün de
doğrudan sorgulanarak modalda açılır. `/urun/<uuid>` Vercel üzerinde alternatif yoldur.

## 5. Storage davranışı

`product-images` **public** bucket'tır. Listeleme/yazma/silme RLS ile yalnız admin'e
açıktır; public dosya URL'sini bilen herkes dosyayı indirebilir. Pasif ürünün
görselini de URL üzerinden okuyabilir. Gizli görseller için private bucket ve
yetkili signed URL tasarımı gerekir.

Yeni görsel UUID ile yeni dosya yoluna yüklenir, eski dosyanın üzerine yazılmaz.
Başarısız veritabanı kaydında yeni dosya temizlenmeye çalışılır; hata bildirilir.
Görsel değişiminde / ürün siliminde eski dosya otomatik silinmez: başka ürün aynı
URL'yi kullanabilir. Kullanılmayan dosyaları Storage'da kontrollü temizleyin.
Auth/Storage HTTP işlemleriyle ürün kaydı ortak transaction değildir; ağ kopması
sonrası sonucu panelde kontrol edin.

### Silinebilir örnekler

Yerel önizlemede `VITE_DEMO_MODE=true` ile 9 örnek gösterilir. "Örnekleri yönet"
butonuyla kartlardaki "Örneği sil" kontrolü açılır. Silme sadece bu tarayıcıya
localStorage ile kaydedilir ve sayfa yenilendiğinde korunur; "Geri yükle" geri getirir.
Bu işlem üretim veritabanını etkilemez. Tarayıcı depolaması temizlenirse örnekler geri gelir.

Canlı Supabase'e isteğe bağlı örnek veri eklemek için setup.sql sonrasında
`supabase/sample-data.sql` dosyasını çalıştırın. Örneklerin kodu ORNEK-SYD- ile başlar,
is_sample=true işaretlidir ve panelden normal ürün gibi silinebilir.
Seed tekrar çalıştırılırsa mevcut ürünün değişmiş stok miktarını ezmez;
silinmiş örnekleri geri ekler. Otomatik çalışmaz.
Tüm örnekleri SQL Editor'den kaldırmak için `delete from public.products where is_sample = true;`
kullanılabilir; gerçek ürünler bu koşula dahil olmaz.

Örnek doku atlası `public/samples/leather-atlas.png` yerel dosyasıdır; altı farklı
renk CSS background-position ile gösterilir. Gerçek ürün URL'si veya yüklenen fotoğraf
eklendiğinde o fotoğraf gösterilir. Üretim derlemesi demo moduna izin vermez.

## 6. GitHub'a aktarım

GitHub'da boş depo oluşturun. `.env.local` commit edilmez; kilit dosyası commit edilir.
Proje klasöründe çalıştırın; URL'yi kendi deponuzla değiştirin:

```bash
git init
git add .
git commit -m "Add Supabase product catalog and admin panel"
git branch -M main
git remote add origin https://github.com/yusuf-basaran/Sayder.git
git push -u origin main
```

Mevcut Git deposunda `git init` / remote ekleme yerine mevcut branch ve remote'u
kullanın. Zip'i depoya tek dosya olarak yüklemeyin; içeriğini açıp proje dosyalarını aktarın.

## 7. Vercel deployment

Vercel > Add New Project > Import Git Repository. Bu klasörü repo köküne koyduysanız
Root Directory kök dizindir; monorepo içinde ilgili proje klasörünü seçin.
Framework Vite, Install Command `pnpm install --frozen-lockfile`, Build Command
`pnpm build`, Output Directory `dist`. `vercel.json` bu ayarları içerir.
Node.js sürümünü 24.x seçin.

Environment Variables'a aşağıdakileri ekleyin (Production; gerekiyorsa Preview ve Development):

| Değişken | Değer |
| --- | --- |
| VITE_SUPABASE_URL | https://PROJE.supabase.co |
| VITE_SUPABASE_ANON_KEY | publishable veya legacy anon key |
| VITE_COMPANY_NAME | Gerçek firma adı |
| VITE_COMPANY_EMAIL | İletişim e-postası |
| VITE_COMPANY_PHONE | 0530 360 63 63 |
| VITE_COMPANY_ADDRESS | Firma adresi |
| VITE_WORKING_HOURS | Çalışma saatleri |
| VITE_WHATSAPP_NUMBER | Ülke kodu dahil rakamlar |
| VITE_DEMO_MODE | false |

Env değişiklikleri build-time'dır: her değişiklikten sonra Redeploy yapın.
Supabase Data API'de public schema'nın açık olduğunu doğrulayın.
`vercel.json` tüm istekleri index'e çevirmez: admin belgesi ve asset'ler korunur,
yalnız `/admin` ve `/urun/:id` route'ları rewrite edilir. Güvenlik header'ları ve
CSP vardır; standart Supabase alan adı desteklenir. Özel Supabase domain'i
kullanacaksanız client URL doğrulamasını ve CSP connect-src listesini dar biçimde güncelleyin.

Yayın sonrası: anonim aktif/pasif görünürlüğü, admin olmayan kullanıcının yazamaması,
admin CRUD, 5 MB yükleme, silme onayı, WhatsApp, ürün linki ve mobil görünümü kontrol edin.
İlk kullanımda kategori ekleyin veya isteğe bağlı örnek scriptini çalıştırın.
setup.sql boş katalog kurar, örnekler ayrı sample-data.sql içindedir.

## Dosya ağacı

```text
├── index.html
├── admin.html
├── css/style.css
├── js/
│   ├── supabaseClient.js
│   ├── catalog.js
│   ├── admin.js
│   ├── utils.js
│   └── demo.js
├── public/placeholder.svg
├── public/samples/leather-atlas.png
├── supabase/setup.sql
├── supabase/sample-data.sql
├── tests/security.test.js
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── .env.example
├── .gitignore
├── vercel.json
└── README.md
```

## Doğrulama kapsamı

`pnpm test`: PGlite PostgreSQL motorunda Auth/Storage test şemalarıyla gerçek SQL
kurulumu ve tekrar çalıştırma, anon erişimi, sıradan kullanıcının yazamaması,
admin CRUD, admin atamasının kaldırılması, Storage RLS, foreign key ve ölçü kısıtları.
Ek olarak HTML kaçışı, URL ve arama karakterleri kontrol edilir.
Bu testler canlı Supabase Auth/Storage servisi veya Vercel deployment'ını doğrulamaz.

Resmi kaynaklar:
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [E-posta/şifre girişi](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Storage erişim kontrolü](https://supabase.com/docs/guides/storage/security/access-control)
- [Vite environment variables](https://vite.dev/guide/env-and-mode)
- [Vercel yapılandırması](https://vercel.com/docs/project-configuration)
