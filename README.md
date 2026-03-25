This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## API Documentation

### Laporan Santri (Mobile App)

Endpoint ini digunakan untuk memuat semua riwayat laporan (akademik, absensi, kegiatan, tes) milik santri berdasarkan nama. Endpoint ini mengembalikan sekumpulan data dalam bentuk `Array` yang berisi riwayat dari seluruh term/Dufah yang pernah diikuti santri, serta menyertakan keterangan Dufah yang sedang berlangsung saat ini.

- **URL:** `/api/mobile/laporan-santri`
- **Metode:** `GET`
- **Content-Type:** `application/json`

#### Query Parameters

| Parameter     | Tipe     | Wajib | Deskripsi |
| :---          | :---     | :---  | :---      |
| `nama`        | `String` | **Ya**    | String nama santri yang ingin dicari. Mendukung pencarian sebagian nama dan *case-insensitive* (tidak peka huruf besar/kecil). Contoh: `?nama=ahmad` |
| `dufahNama`   | `String` | Tidak | Opsi untuk mendefinisikan pencarian riwayat pada rentang waktu (Dufah) yang spesifik. Jika dibiarkan kosong, maka sistem akan mereturn **semua** riwayat sekaligus. |

#### Struktur Respon (Berhasil - 200 OK)

```json
{
  "success": true,
  "active_dufah": "Dufah 7",
  "data": [
    {
      "id_riwayat": "cuid...",
      "dufah": "Dufah 7",
      "santri": {
        "id": "S...",
        "nama": "Ahmad Fulan",
        "tempat_lahir": "...",
        "tanggal_lahir": "..."
      },
      "akademik": {
        "program": "Program A",
        "kelas": "Kelas A1",
        "status_kelulusan": "LULUS"
      },
      "nilai_per_mapel": [...],
      "rekap_absen_per_usbu": [...],
      "histori_absen_terbaru": {
        "kelas": [...],
        "sakan": [...],
        "kegiatan": [...]
      }
    },
    {
      "id_riwayat": "cuid...",
      "dufah": "Dufah 6",
      "santri": {...},
      "akademik": {...},
      // Data lama...
    }
  ]
}
```

#### Struktur Respon (Error 400 - Bad Request)
```json
{
  "success": false,
  "message": "Nama santri diperlukan (Misal: ?nama=Ahmad)"
}
```

#### Struktur Respon (Error 404 - Not Found)
```json
{
  "success": false,
}
```

### Agenda Rutinan (Mobile App)

Endpoint ini digunakan untuk memuat daftar agenda dan kegiatan rutinan yang ada di Markaz. Endpoint ini secara otomatis mengatur perulangan agenda (harian, mingguan, bulanan) sehingga aplikasi _mobile_ tidak perlu melakukan kalkulasi tanggal secara manual.

- **URL:** `/api/mobile/agenda`
- **Metode:** `GET`
- **Content-Type:** `application/json`

#### Query Parameters

| Parameter | Tipe      | Wajib | Deskripsi |
| :---      | :---      | :---  | :---      |
| `month`   | `Integer` | Tidak | Angka bulan yang ingin dicari (1-12). Jika kosong, akan menggunakan bulan ini. |
| `year`    | `Integer` | Tidak | Angka tahun yang ingin dicari. Jika kosong, akan menggunakan tahun ini. |

#### Struktur Respon (Berhasil - 200 OK)

```json
{
  "success": true,
  "month": 8,
  "year": 2026,
  "data": [
    {
      "id": "cuid...",
      "judul": "Kajian Rutin",
      "deskripsi": "Kajian kitab...",
      "waktuMulai": "2026-08-01T16:00:00.000Z",
      "waktuSelesai": "2026-08-01T17:30:00.000Z",
      "isBerulang": true,
      "tipePerulangan": "MINGGUAN",
      "batasPerulangan": null,
      "instanceDate": "2026-08-08T16:00:00.000Z", 
      "instanceWaktuSelesai": "2026-08-08T17:30:00.000Z"
    }
  ]
}
```
*(Catatan: `instanceDate` dan `instanceWaktuSelesai` adalah tanggal aktual kejadian pada bulan yang di-*request*, meskipun `waktuMulai` aslinya ada di masa lalu).*

---

### Konten Instagram (Mobile App)

Endpoint ini digunakan untuk mengambil daftar tautan (_link_) post Instagram aktif yang sudah dimasukkan oleh Admin.

- **URL:** `/api/mobile/instagram`
- **Metode:** `GET`
- **Content-Type:** `application/json`

#### Struktur Respon (Berhasil - 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "cuid...",
      "judul": "Pengumuman Pendaftaran",
      "url": "https://instagram.com/p/...",
      "isActive": true,
      "createdAt": "2026-08-15T10:00:00.000Z"
    }
  ]
}
```
