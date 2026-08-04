# Bereket Vadisi 🌾

Catan'dan ilham alan, **tamamen Türkçe**, tarayıcıda oynanan sade bir aile oyunu.
2–4 oyuncu, aynı cihazda sırayla ("hot-seat"). Karışık yaş grupları için basit
kurallar ve isteğe bağlı **Çocuk Modu** içerir.

## Nasıl oynanır?

Vadide köyler kurup yollar döşeyerek **10 puana** ilk ulaşan oyuncu kazanır.

- **Kaynaklar:** 🌲 Odun, 🧱 Tuğla, 🐑 Yün, 🌾 Buğday, ⛰️ Taş
- **İnşaat:** Yol (Odun+Tuğla) · Köy (Odun+Tuğla+Yün+Buğday = 1 puan) · Şehir (2 Buğday+3 Taş = 2 puan)
- **Tur:** Zar at → kaynak üret → banka ile takas yap / inşa et → turu bitir
- **7 gelince:** Kervancı taşınır, o araziyi bloklar (Çocuk Modu'nda çalma/atma yok)
- **En Uzun Yol** (5+ yol): +2 puan

## Çalıştırma

```bash
npm install
npm run dev      # geliştirme sunucusu (tarayıcıda aç)
npm run build    # üretim derlemesi
npm test         # oyun mantığı birim testleri
```

## Teknik

Vite + TypeScript + saf SVG. Ek oyun kütüphanesi yok.

- `src/game/` — saf oyun mantığı (tahta, kurallar, durum) — render'dan bağımsız, test edilebilir
- `src/render/` — SVG tahta çizimi ve arayüz panelleri
- `src/ui/` — tur akışı ve etkileşim kontrolörü
