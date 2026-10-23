# Kenangin — Design Reference

**v0.2 · Markdown edition**

Dokumen ini merangkum arah visual Kenangin — warna, tipografi, logo, dan panduan penerapannya di tiga bagian produk (marketing, halaman upload tamu, dashboard host).

---

## 1. Brand Overview

- **Nama:** Kenangin — platform kumpul foto acara lewat satu link/QR, tanpa install aplikasi, tanpa login untuk tamu.
- **Konsep visual:** *Digital Memory Album* — album foto/scrapbook/polaroid, dieksekusi dengan UI modern.
- **Karakter brand:** Warm · Personal · Joyful · Simple · Trustworthy · Modern
- **Hindari kesan:** Corporate, Futuristic, Tech-heavy, terlalu identik dengan satu jenis acara (mis. wedding-only)
- **Pesan utama:** *"Kenangin Kenangan."* / *"Semua momen, dari semua sudut."*

---

## 2. Warna

Oranye dipilih sebagai warna utama (bukan pink/coral) supaya terasa netral secara gender — tetap hangat seperti sunset & flash kamera, tanpa condong ke kesan romantis/feminin.

| Warna | Hex | Penggunaan |
|---|---|---|
| 🟧 Sunset Orange | `#FF6B35` | Primer — CTA, aksen utama, logo |
| 🟪 Midnight Plum | `#241435` | Teks utama, latar gelap, kontras |
| 🟨 Sunbeam Yellow | `#FFC845` | Aksen kedua — badge, highlight |
| 🟦 Sky Confetti | `#3FB6E0` | Aksen ketiga — grafik, ilustrasi, penyeimbang netral |
| ⬜ Warm Paper | `#FFF7F2` | Latar utama (light mode) |
| ⬜ Soft Grey | `#E9E1E6` | Border, divider, elemen netral |

**Warna fungsional/semantik:**

| Status | Hex |
|---|---|
| Success | `#2E7D32` |
| Warning | `#ED6C02` |
| Error | `#D32F2F` |

**Design tokens:**

```css
--primary: #FF6B35;
--primary-hover: #E85A2A;
--text: #241435;
--accent-yellow: #FFC845;
--accent-sky: #3FB6E0;
--background: #FFF7F2;
--border: #E9E1E6;
--success: #2E7D32;
--warning: #ED6C02;
--error: #D32F2F;
--radius: 12px–24px;
```

---

## 3. Tipografi

Fredoka (rounded, playful) untuk judul-judul di UI — Plus Jakarta Sans untuk body text & UI karena tetap jernih di layar kecil. Wordmark logo "kenangin" sendiri adalah custom lettering terpisah (lihat bagian Logo), bukan font Fredoka apa adanya.

| Elemen | Font | Ukuran |
|---|---|---|
| Heading 1 | Fredoka 600 | 40px — hero/judul utama |
| Heading 2 | Fredoka 600 | 28px — judul section |
| Heading 3 | Fredoka 500 | 20px — judul kartu/subsection |
| Body | Plus Jakarta Sans 400 | 16px — teks deskripsi |
| Caption | Plus Jakarta Sans 500 | 13px — label status/tanggal |

---

## 4. Logo (Final)

<img src="assets/icon-final.png" width="120" alt="Kenangin icon">

**Ikon:** tiga bingkai foto instan yang saling tumpuk dan sedikit miring, dengan area foto putih di dalamnya — merepresentasikan galeri yang terkumpul dari sudut pandang tamu yang berbeda-beda.

**Wordmark:** custom lettering rounded/bubbly, huruf kecil semua (lowercase) — terasa personal & approachable. Titik pada huruf "i" diganti bingkai foto kecil berwarna oranye, menyambung motif ikon.

<img src="assets/lockup-final.png" width="320" alt="Kenangin logo lockup">

> **Catatan:** aset di atas adalah versi final warna penuh di latar terang. Untuk kebutuhan latar gelap (dashboard dark mode, banner foto), perlu dibuat turunan versi putih/monokrom dari kedua aset ini terpisah.

**Cara pakai:**
- Ikon saja untuk favicon, app icon, avatar sosial media
- Ikon + wordmark untuk header web dan materi marketing
- Clearspace minimum: tinggi satu bingkai foto di semua sisi
- Jaga rasio ikon:wordmark seperti pada lockup di atas — jangan diregangkan tidak proporsional

**Hindari:**
- Mengubah urutan warna tumpukan (oranye selalu di depan)
- Memutar ikon lebih dari sudut aslinya
- Menambahkan bayangan atau outline ekstra di luar yang sudah ada

---

## 5. Struktur Karakter — Tiga Nuansa dalam Satu Brand

Token warna & tipografi sama di semua bagian, tapi porsi ekspresi vs fungsi berbeda:

| Bagian | Karakter | Deskripsi |
|---|---|---|
| **Marketing / Landing** | Emosional | Foto besar, headline personal, warna tampil penuh |
| **Guest Upload** | Sesederhana mungkin | Satu tombol, satu tujuan, tanpa elemen yang mengganggu |
| **Host Dashboard** | Netral & fungsional | Latar tenang, warna brand hanya di aksi utama |

---

## 6. Arahan Foto — Candid, Bukan Stock Photo

USP produk adalah foto dari sudut pandang tamu — materi visual brand harus konsisten dengan itu.

**✅ Pakai**
- Tawa candid, foto meja tamu, selfie grup
- Sedikit blur/miring — terasa jujur
- Detail kecil: dekorasi, makanan, momen kecil
- Rasio campur 1:1, 4:5, 3:4, rotasi -4° s/d +3° di landing page

**🚫 Hindari**
- Stock photo korporat / terlalu sempurna
- Semua foto seragam rapi ala katalog
- Rotasi foto dipakai di galeri host (harus bersih)

---

## 7. Guest Upload Page

Halaman paling kritis dari seluruh produk — tanpa login, tanpa navbar, tanpa sidebar. Satu layar, satu aksi: kirim foto ke album acara.

**Elemen:** nama acara + tanggal, area drop foto, tombol "Upload Foto", catatan singkat bahwa foto akan dilihat pemilik acara.

**Upload states** — harus jujur & manusiawi, bukan pesan error teknis:

| State | Contoh copy |
|---|---|
| Mengunggah | "Mengunggah 3 foto... 70%" |
| Berhasil | "Foto berhasil dikirim. Terima kasih sudah ikut menyimpan momen ini." |
| Gagal | "Koneksi internet tampaknya tidak stabil." + tombol "Coba Lagi" |

---

## 8. Tone of Voice — Hangat, Bukan Korporat

**✅ Pakai**
- "Semua momen, dari semua sudut."
- "Satu link untuk semua kenangan."
- "Koneksi tampaknya tidak stabil — coba lagi, ya."

**🚫 Hindari**
- "Revolutionary event photo management platform."
- "Centralized cloud-based image aggregation."
- "NetworkError: Failed to fetch."

---

## 9. Template QR Code

QR dicetak fisik di meja/undangan — harus tetap on-brand, bukan kotak hitam-putih generik.

- Latar: Warm Paper `#FFF7F2`
- Nama acara di atas QR
- Teks "Scan & bagikan foto" di bawah QR
- Wordmark kecil di paling bawah
- QR tetap gelap pekat agar mudah dipindai

---

*Kenangin — Design Reference v0.2 · dokumen ini editable, silakan disesuaikan.*