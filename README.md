# Bereket Vadisi 🌾

Catan'dan ilham alan, **tamamen Türkçe**, tarayıcıda oynanan sade bir aile oyunu.
2–4 oyuncu. **İki oynama biçimi** var:

- **📱 Bu cihazda (sırayla):** Tek cihazı sırayla kullanın.
- **🛰️ Çevrimiçi (telefonlarla):** Herkes kendi cihazından katılır. Bir kişi
  **oda kurar**, oda kodunu paylaşır; diğerleri **koda katılır**. Bağlantı,
  PeerJS/WebRTC ile doğrudan cihazlar arasında kurulur (sunucu/kayıt gerekmez).
  Oda kuran kişi sekmesini açık tutmalıdır.

Karışık yaş grupları için basit kurallar ve isteğe bağlı **Çocuk Modu** içerir.

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

Vite + TypeScript + saf SVG. Ağ için PeerJS (WebRTC).

- `src/game/` — saf oyun mantığı (tahta, kurallar, durum, eylemler) — render'dan bağımsız, test edilebilir
- `src/render/` — SVG tahta çizimi (dokulu illüstrasyon) ve arayüz panelleri
- `src/ui/` — koltuk bazlı tur akışı ve etkileşim kontrolörü
- `src/net/` — PeerJS taşıma + oda (host yetkili durumu tutar, guest'ler eylem gönderir)
- `src/session.ts` — yerel/host/guest için ortak oturum soyutlaması

Çevrimiçi mimari: **host** oyunu yürütür (yetkili durum), her eylemden sonra tam
durumu tüm cihazlara yayınlar; **guest**'ler yalnızca sırası gelince eylem gönderir.
