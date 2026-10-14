# SAYDER SUNİ DERİ

Ürün ve stok kataloğu: HTML5, Vanilla JavaScript ES Modules, derlenen Tailwind CSS,
Vite, Supabase JS v2, PostgreSQL/RLS/Auth/Storage ve Vercel.

- Katalog: https://www.sayder.tech/
- Yönetim: https://www.sayder.tech/admin.html
- GitHub: https://github.com/yusuf-basaran/Sayder
- Supabase proje ref'i: `hhfnxebtbpsttdsnplgd`
- Yönetici e-postası: `sayder@sunideri.com`

## Arama motoru ve paylaşım bilgileri

Ana adres `https://www.sayder.tech/` olarak ayarlanmıştır; kök alan adı Vercel'de
bu adrese yönlendirilir. Başlık, açıklama, canonical, Open Graph, Twitter Card,
kurumsal JSON-LD, favicon ve sosyal paylaşım görseli HTML içinde tanımlıdır.
`public/robots.txt` ve `public/sitemap.xml` arama motorlarını ana kataloğa yönlendirir;
yönetim paneli HTML ve HTTP header üzerinden noindex olarak korunur.
Google Search Console'da alan adını doğruladıktan sonra `sitemap.xml` gönderilebilir.
Firma adresi veya iletişim bilgileri değişirse index.html içindeki JSON-LD de güncellenmelidir.

Kullanıcının sağladığı kurumsal PNG dosyası `public/sayder-original.png` içinde
korunur. Sitede `sayder-logo.webp` ile tam logo kullanılır. Soldaki renkli amblem
ikonlar için ayrılmıştır; `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`
ve `logo-512.png` bu amblemi kullanır. Paylaşım kartı da tam kurumsal logoyu içerir.
Logo ve ikon dosyalarının arka planı şeffaftır. Marka renkleri, tipografi ve
bileşen kuralları `BRAND.md` içinde; uygulama stilleri `css/identity.css` içindedir.

## Dil seçenekleri

Katalog ve yönetim paneli 18 arayüz dili içerir. Türkçe, İngilizce, Arapça,
Rusça, Almanca, Fransızca, İspanyolca, Bulgarca, Yunanca, Gürcüce, Ermenice,
Azerbaycanca, Farsça, Romence, Ukraynaca, İbranice, Kürtçe Kurmancî ve Soranî.
Seçim tarayıcıda hatırlanır; `?lang=bg` gibi bağlantılar da desteklenir.
Arapça, Farsça, İbranice ve Soranî sağdan sola görünür. Sayfa yenilenmeden
dil değişir, formlardaki değerler korunur. Stok sayıları ve WhatsApp mesajları
seçili dile göre biçimlendirilir. Ürün adları, renkler ve açıklamalar yönetici
tarafından yazıldıkları dilde kalır. Tanımlı standart kategori adları çevrilir.

| Ülkeler | Dil seçenekleri |
| --- | --- |
| Bulgaristan | Bulgarca |
| Yunanistan, Kıbrıs Cumhuriyeti | Yunanca |
| Gürcistan | Gürcüce |
| Ermenistan | Ermenice |
| Azerbaycan | Azerbaycanca |
| İran | Farsça |
| Irak | Arapça, Kürtçe Kurmancî ve Soranî |
| Suriye, Lübnan, Mısır, Libya | Arapça (Lübnan için Fransızca da mevcut) |
| Romanya | Romence |
| Ukrayna | Ukraynaca |
| Rusya | Rusça |
| Kuzey Kıbrıs Türk Cumhuriyeti | Türkçe |
| İsrail | İbranice, Arapça |

Çeviri sözlükleri `js/translations.js` ve `js/translations-extra.js` içindedir.
Ek bölgesel dillerin metinleri geliştirme aşamasında makine çevirisiyle hazırlanmıştır;
ticari terminoloji anadili konuşan bir kişi tarafından bu dosyalarda gözden geçirilebilir.
Ziyaret sırasında harici çeviri servisi çağrılmaz ve ürün verileri çeviri servisine gönderilmez.

## Veritabanı ve yönetici kurulumu

Yeni kurulumda Supabase SQL Editor'de `supabase/sayder-kurulum.sql` dosyasının
tamamını çalıştırın. Script tabloları, indeksleri, RLS kurallarını ve görsel
bucket'ını kurar; Authentication > Users'ta bulunan `sayder@sunideri.com`
hesabını admin olarak atar. Kategori veya ürün kaydı otomatik eklenmez.

Başka bir projede yalnız şema için `supabase/setup.sql` kullanılabilir. İlk admin
hesabını Authentication > Users üzerinden oluşturup e-postasını doğrulayın.
Ardından SQL Editor'de e-postayı uygun değerle değiştirip çalıştırın:

```sql
insert into public.admin_users(user_id)
select id from auth.users where lower(email)=lower('sayder@sunideri.com')
on conflict(user_id) do nothing;
```

Auth ayarlarından herkese açık kullanıcı kaydını kapatın. Admin atamasını
kaldırmak için SQL Editor'de ilgili `admin_users` satırını silin.
Giriş yapmış olmak yönetici olmak için yeterli değildir; tüm yazma işlemleri
admin_users üyeliğini kontrol eden RLS ile korunur. Anon ziyaretçiler yalnız
aktif ürünleri ve kategorileri okuyabilir. Admin listesi tarayıcıdan değiştirilemez.

## Yerel geliştirme

Node.js 22.12+ (Node 24 önerilir) ve pnpm 11.25.0 kullanın:

```bash
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Katalog `/`, yönetim `/admin.html` adresindedir. Uygulama yalnız Supabase'den
veri okur; bağlantı yoksa anlaşılır bir hata ve yeniden deneme kontrolü gösterir.
HTML belgelerini `file://` ile açmayın.

`js/publicConfig.js`, tarayıcı istemcisine ait public proje URL'si ve anon
anahtarı içerir. Bu değerler tarayıcıda görünür; veri değiştirme iznini RLS
belirler. service_role, sb_secret_ ve hesap şifresi bu dosyaya konulamaz.
Derleme, yanlışlıkla ayrıcalıklı anahtar girilirse durur.

Başka projeye bağlanmak veya firma bilgilerini değiştirmek için `.env.example`
şablonunu `.env.local` dosyasına kopyalayıp geçerli değerleri girin. VITE_ değerleri
publicConfig.js değerlerinin önüne geçer. Değişiklikten sonra dev sunucusunu
yeniden başlatın. `.env.local` GitHub'a gönderilmez.

## Ürün yönetimi

Yetkili e-posta ve kendi şifrenizle yönetim paneline giriş yapın:

1. Kategori oluşturun; ad ve slug girin. Türkçe adlar otomatik slug'a çevrilebilir.
2. Ürün adı, benzersiz ürün kodu, kategori, renk ve materyali girin.
3. En (cm), kalınlık (mm) ve rulo uzunluğunu (metre) girin.
4. Kalan stok miktarını ve birimini (metre/rulo/adet) belirleyin.
5. HTTPS görsel URL'si veya en fazla 5 MB JPG/PNG/WebP/AVIF dosyası ekleyin.
6. Ürünün katalogda yayınlanıp yayınlanmayacağını seçip kaydedin.

Stok negatif olamaz. Rulo uzunluğu ve kalan stok birbirinden bağımsızdır.
Bu uygulama katalogdur; sipariş veya satışla otomatik stok düşürme yapmaz.
Liste üzerinde düzenleme, yayın durumu değiştirme ve onaylı silme kontrolleri vardır.
Kullanılan kategori, ürünler başka bir kategoriye taşınana kadar silinemez.

Katalogda arama ürün adı, kodu, renk, materyal ve ölçü metnini tarar; debounce
250 ms'dir. Katalog 12, yönetim 25 kayıtlık sunucu sayfalaması kullanır.
Stokta olanlar filtresi `stock_quantity > 0` koşulunu uygular. Ürün linkleri
`/?product=<uuid>` ve Vercel üzerinde `/urun/<uuid>` biçimindedir.

## Görseller ve Storage

Gerçek ürün fotoğrafları URL veya Supabase Storage ile yönetilir. Görseli
bulunmayan ürünlerde yalnız nötr bir yer tutucu gösterilir.
`product-images` public bucket'tır: dosya URL'sini bilen herkes dosyayı okuyabilir.
Yükleme/değiştirme/silme izinleri yalnız admin'e açıktır. Pasif ürünün dosyasını
gizlemek gerekiyorsa private bucket ve signed URL tasarımı gerekir.

Yeni dosyalar UUID'li yollarla yüklenir. Veritabanı kaydı başarısız olursa yeni
dosya temizlenmeye çalışılır. Ürün/görsel değişiminde eski dosya otomatik silinmez;
başka ürün aynı URL'yi kullanabilir. Kullanılmayan dosyaları Storage'da kontrollü
temizleyin. Ağ kopması sonrası panelde işlemin sonucunu kontrol edin.

## GitHub ve Vercel

Kilit dosyasını commit edin; node_modules, dist ve yerel env dosyaları Git'e girmez:

```bash
git add .
git commit -m "Update SAYDER catalog"
git push origin main
```

Vercel'de GitHub deposunu import edin. Framework Vite, Node.js 24.x,
Install Command `pnpm install --frozen-lockfile`, Build Command `pnpm build`,
Output Directory `dist`. Ayarlar `vercel.json` dosyasında bulunur.

SAYDER public bağlantısı kodda olduğundan bağlantı için env değişkeni zorunlu
değildir. Başka bağlantı veya firma bilgileri için şu değerler kullanılabilir:

| Değişken | Kullanım |
| --- | --- |
| VITE_SUPABASE_URL | Supabase proje URL'si |
| VITE_SUPABASE_ANON_KEY | Publishable veya legacy anon key |
| VITE_COMPANY_NAME | Firma adı |
| VITE_COMPANY_EMAIL | İletişim e-postası |
| VITE_COMPANY_PHONE | Telefon |
| VITE_COMPANY_ADDRESS | Adres |
| VITE_WORKING_HOURS | Çalışma saatleri |
| VITE_WHATSAPP_NUMBER | Ülke kodu dahil yalnız rakamlar |

Environment Variables değişiklikleri için Redeploy gerekir. Key rotasyonunda
publicConfig.js veya env değerlerini güncelleyin. Özel Supabase domain'i
kullanılırsa URL doğrulaması ve CSP connect-src listesi de güncellenmelidir.

## Doğrulama

```bash
pnpm test
pnpm build
pnpm preview
```

Testler PGlite PostgreSQL motorunda RLS, admin ataması, yetki iptali, CRUD,
Storage izinleri, foreign key, ölçü ve stok kısıtlarını doğrular. HTML kaçışı,
HTTPS görsel adresi, Türkçe slug ve arama karakterleri de kontrol edilir.

Firma iletişim bilgileri kullanıcının sağladığı kaynaklardan alınmıştır:
[Yandex](https://yandex.com.tr/maps/-/CXBIr8Ym),
[Facebook](https://www.facebook.com/groups/877165027323660),
[Instagram](https://www.instagram.com/saydersunideri/).

Resmi teknik kaynaklar:
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Supabase Auth](https://supabase.com/docs/reference/javascript/auth-signinwithpassword),
[Storage](https://supabase.com/docs/guides/storage/security/access-control),
[Vite](https://vite.dev/guide/env-and-mode),
[Vercel](https://vercel.com/docs/project-configuration).
