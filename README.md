# SAYDER SUNİ DERİ

Suni deri, döşemelik ve kapitone ürünleri için çevrimiçi katalog ve stok yönetimi.

- [Ürün kataloğu](https://www.sayder.tech/)
- [Yönetim paneli](https://www.sayder.tech/admin.html)
- [GitHub deposu](https://github.com/yusuf-basaran/Sayder)

## Özellikler

- Ürün adı, kodu, renk, materyal ve ölçüye göre arama
- Kategori, stok durumu ve sıralama filtreleri
- Teknik detay penceresi ve ürüne özel WhatsApp bağlantısı
- Kalan stok miktarı ve metre, rulo veya adet birimi
- Ürün ve kategori yönetimi; aktif/pasif yayın durumu
- Görsel URL veya Supabase Storage üzerinden fotoğraf yükleme
- 18 dil, kalıcı dil tercihi ve sağdan sola yazım desteği
- Mobil uyumlu arayüz ve skeleton yükleme görünümü

## Teknoloji

HTML5, Vanilla JavaScript ES Modules, Tailwind CSS, Vite, Supabase JS v2,
PostgreSQL, Supabase Auth ve Storage. Yayın Vercel üzerinden yapılır.

## Proje yapısı

```text
index.html               Ziyaretçi kataloğu
admin.html               Yönetim paneli
css/                     Arayüz, marka ve yükleme stilleri
js/                      Bağlantı, katalog, yönetim ve dil modülleri
public/                  Kurumsal görseller, ikonlar, robots.txt ve sitemap.xml
supabase/setup.sql       Veritabanı şeması ve erişim politikaları
supabase/sayder-kurulum.sql  Şema ve ilk yönetici kurulumu
tests/                   Güvenlik ve dil testleri
BRAND.md                 Görsel kimlik rehberi
vercel.json              Yayın ve güvenlik başlıkları
.env.example             Ortam değişkenleri şablonu
```

## Yerel kurulum

Node.js 22.12 veya üzeri ve pnpm 11.25.0 gerekir.

```bash
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
```

`.env.example` dosyasını `.env.local` olarak kopyalayıp Supabase proje URL'sini
ve public anon/publishable anahtarını tanımlayın:

```dotenv
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=PUBLIC_KEY
```

```bash
pnpm dev
```

Katalog `/`, yönetim `/admin.html` adresinde açılır. Ortam değişkeni değiştiğinde
sunucuyu yeniden başlatın. HTML dosyalarını doğrudan `file://` ile açmayın.

Mevcut bağlantının public varsayılanları `js/publicConfig.js` içindedir.
`VITE_` değişkenleri bu değerlerin önüne geçer. Public anahtar tarayıcıda görünür;
yetkilendirme veritabanındaki RLS politikalarıyla yapılır. `service_role`,
`sb_secret_` veya hesap şifresini istemci koduna eklemeyin. Derleme ayrıcalıklı
anahtarları reddeder. `.env.local` Git'e dahil edilmez.

## Supabase kurulumu

1. Authentication → Users bölümünden yönetici hesabını oluşturup doğrulayın.
2. SQL Editor'de `supabase/sayder-kurulum.sql` dosyasını çalıştırın. Bu dosya
   `sayder@sunideri.com` hesabını yönetici olarak atar.
3. Başka bir yönetici için aşağıdaki sorgudaki e-posta adresini değiştirin.
4. Authentication ayarlarında herkese açık kullanıcı kaydını kapatın.

```sql
insert into public.admin_users(user_id)
select id from auth.users where lower(email)=lower('sayder@sunideri.com')
on conflict(user_id) do nothing;
```

Yalnız şema kurulumu için `supabase/setup.sql` kullanılabilir. Kurulum kategori
veya ürün eklemez. Ziyaretçiler yalnız aktif ürünleri ve kategorileri okuyabilir.
Ürün, kategori ve Storage yazma işlemleri `admin_users` üyeliği gerektirir;
giriş yapmış olmak tek başına yönetim yetkisi vermez. Yönetici atamaları
veritabanından yönetilir.

## Ürün yönetimi

1. Yetkili hesapla yönetim paneline giriş yapın.
2. Kategori oluşturun veya mevcut bir kategori seçin.
3. Ürün adı, benzersiz kod, renk, materyal ve açıklama girin.
4. En (cm), kalınlık (mm), rulo uzunluğu (m), stok miktarı ve birimini belirleyin.
5. HTTPS görsel adresi veya en fazla 5 MB JPG, PNG, WebP ya da AVIF ekleyin.
6. Yayın durumunu seçip kaydedin.

Stok negatif olamaz. Rulo uzunluğu ile kalan stok ayrı alanlardır. Satışla
otomatik stok düşürme yapılmaz. Ürün silme işlemi onay gerektirir. Ürünlerde
kullanılan kategori, ilişkili ürünler taşınana kadar silinemez.

Katalog sayfa başına 12, yönetim paneli 25 kayıt getirir. Arama 250 ms gecikmeyle
çalışır. Ürün bağlantıları `/?product=<uuid>` veya `/urun/<uuid>` biçimindedir.
Yükleme sırasında skeleton, hata durumunda yeniden deneme kontrolü gösterilir.
Azaltılmış hareket tercihinde skeleton animasyonu kapanır.

## Dil desteği

Türkçe, İngilizce, Arapça, Rusça, Almanca, Fransızca, İspanyolca, Bulgarca,
Yunanca, Gürcüce, Ermenice, Azerbaycanca, Farsça, Romence, Ukraynaca, İbranice,
Kürtçe Kurmancî ve Soranî desteklenir. Seçim tarayıcıda saklanır;
`?lang=bg` gibi bağlantılarla doğrudan dil seçilebilir.

Arapça, Farsça, İbranice ve Soranî sağdan sola gösterilir. Dil değişiminde form
ve arama değerleri korunur. WhatsApp mesajları ve stok sayıları seçili dile göre
biçimlendirilir. Ürün adları, renkler ve açıklamalar girildikleri dilde kalır.
Standart kategori adları çevrilir; özel kategori adları korunur.

Arayüz metinleri `js/translations.js` ve `js/translations-extra.js` içindedir.
Çeviriler uygulamayla birlikte sunulur; harici çeviri servisi kullanılmaz.

## Görseller ve marka

Kurumsal kaynak logo `public/sayder-original.png`, site logosu
`public/sayder-logo.webp` içindedir. İkonlar soldaki amblemi kullanır.
Logo ve ikon arka planları şeffaftır. Renk ve tipografi kuralları `BRAND.md`,
uygulama stilleri `css/identity.css` içindedir.

`product-images` public Storage bucket'ıdır. Görsellerin URL'sini bilen herkes
bunları okuyabilir; yükleme ve silme yalnız yöneticilere açıktır. Gizli dosyalar
private bucket ve signed URL gerektirir. Yeni dosyalar UUID yollarıyla yüklenir.
Başarısız ürün kaydında yeni yükleme temizlenir. Eski görseller, başka ürünlerce
kullanılabilecekleri için otomatik silinmez; Storage üzerinden kontrol edilmelidir.

## Vercel yayını

GitHub deposunu Vercel'e bağlayın:

| Ayar | Değer |
| --- | --- |
| Framework | Vite |
| Node.js | 24.x |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build` |
| Output Directory | `dist` |

```bash
git add .
git commit -m "Update SAYDER catalog"
git push origin main
```

Ana adres `https://www.sayder.tech/` olarak tanımlıdır; `sayder.tech` bu adrese
yönlendirilir. Ortam değişkenleri değiştirildiğinde Redeploy gerekir.

| Ortam değişkeni | Kullanım |
| --- | --- |
| VITE_SUPABASE_URL | Supabase proje URL'si |
| VITE_SUPABASE_ANON_KEY | Public anon/publishable anahtar |
| VITE_COMPANY_NAME | Firma adı |
| VITE_COMPANY_EMAIL | İletişim e-postası |
| VITE_COMPANY_PHONE | Telefon |
| VITE_COMPANY_ADDRESS | Adres |
| VITE_WORKING_HOURS | Çalışma saatleri |
| VITE_WHATSAPP_NUMBER | Ülke kodu dahil yalnız rakamlar |

Canonical, Open Graph, paylaşım görseli ve işletme JSON-LD bilgileri `index.html`
içindedir. İletişim bilgileri değiştiğinde JSON-LD de güncellenmelidir.
Google Search Console'da alan adını doğrulayıp `sitemap.xml` gönderin.
Yönetim paneli arama motorlarına `noindex` olarak sunulur.

## Kontroller

```bash
pnpm test
pnpm build
pnpm preview
```

Testler RLS, yönetici atama/iptal, CRUD, Storage izinleri, veri kısıtları,
HTML kaçışı, güvenli görsel adresleri, arama karakterleri ve dil sözlüklerinin
parametre bütünlüğünü kontrol eder.
