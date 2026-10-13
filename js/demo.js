export const categories = [
  { id: 'oturma', name: 'Oturma grupları', slug: 'oturma' },
  { id: 'masalar', name: 'Masalar', slug: 'masalar' },
  { id: 'sandalyeler', name: 'Sandalyeler', slug: 'sandalyeler' }
];
export const products = [
  ['demo-1', 'Luna modüler koltuk', 'oturma', 'Dokulu keten · meşe', 240, 95, 78, 'photo-1555041469-a586c61ea9bc'],
  ['demo-2', 'Forma yemek masası', 'masalar', 'Doğal meşe', 180, 90, 75, 'photo-1617806118233-18e1de247200'],
  ['demo-3', 'Arc dinlenme koltuğu', 'oturma', 'Bouclé kumaş', 85, 80, 85, 'photo-1567538096630-e0c55bd6374c'],
  ['demo-4', 'Linea sandalye', 'sandalyeler', 'Masif ahşap · keten', 48, 52, 82, 'photo-1598300042247-d088f8ab3a91'],
  ['demo-5', 'Noma sehpa', 'masalar', 'Ceviz kaplama', 110, 60, 42, 'photo-1533090161767-e6ffed986c88'],
  ['demo-6', 'Sera ikili koltuk', 'oturma', 'Kadife · ahşap', 170, 88, 80, 'photo-1493663284031-b7e3aefcae8e']
].map(([id, name, category_id, material, width, depth, height, photo]) => ({
  id, name, category_id, material, dimensions: { width, depth, height },
  categories: categories.find(c => c.id === category_id), color_options: ['Kum', 'Krem', 'Toprak'],
  image_url: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1200&q=80`,
  description: 'Bu kayıt tasarım önizlemesi için örnek üründür. Gerçek ürünlerinizi yönetici panelinden ekleyebilirsiniz.', is_active: true
}));
