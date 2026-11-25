# Umum UPKL

Aplikasi HP Bagian Umum PLN UPK Lombok. Kerangka dan tampilannya sama dengan aplikasi **Aset UPKL v1.4**.

- **Login:** NIP pegawai (dicek ke sheet `Dapeg`) atau tombol **GUEST** tanpa NIP/PIN.
- **GUEST:** sementara hanya bisa membuka Home dan Pinjam Ruang. Tab BBM, SPPD dan Pegawai tetap terlihat, tapi isinya terkunci.
- **Home:** Ruang Rapat · Kupon BBM · SPPD · Pegawai.
- **Pegawai:** nama, unit, jabatan dan foto (dari folder Drive "Foto ID Card UPK"). Ketuk untuk memperbesar foto.
- **Menu ⋮ (segera):** ATK · Kendaraan dinas · Buku tamu · Surat · Lapor kerusakan.

## Spreadsheet "BIG DATA HANYA KU"

| Sheet | Isi | Siapa yang mengisi |
|---|---|---|
| `Dapeg` | Data pegawai (dari SAP) | Anda. Ganti isinya bila ada mutasi; aplikasi selalu membaca data terbaru. **Tidak diubah oleh aplikasi.** |
| `Ruang` | Catatan peminjaman ruang | Aplikasi. Judul kolom dibuat oleh `setup()` |
| `BBM` | Catatan pengajuan kupon BBM | Aplikasi. Judul kolom dibuat oleh `setup()` |
| `SPPD` | Laporan SPPD | Aplikasi. Sheet dibuat oleh `setup()` |
| `DaftarRuang` | Daftar ruang: Nama Ruang, Kapasitas, Lokasi, Fasilitas, Aktif | **Anda** (setup mengisi 2 contoh) |
| `Pengaturan` | `ADMIN_NIP`, `FOLDER_FOTO`, `FOLDER_LAMPIRAN` | Anda (opsional) |
| `Log` | Riwayat simpan / batal / proses | Aplikasi |

Kolom sheet `Ruang`:
`ID, Waktu Input, NIP, Nama Peminjam, Unit / Instansi, No HP, Ruang, Tanggal, Jam Mulai, Jam Selesai, Acara, Jumlah Peserta, Konsumsi, Kopi/Teh, Snack, Makan, Tata Letak, Perlengkapan, Catatan, Status, Diproses Oleh, Catatan Admin`

- `Konsumsi`: Tidak ada / Disiapkan Umum / Dari eksternal.
- `Kopi/Teh`, `Snack`, `Makan`: diisi "Ya", sehingga mudah direkap dengan COUNTIF.

Aplikasi membaca dan menulis berdasarkan **judul kolom**. Jadi urutan kolom boleh diubah dan kolom baru boleh ditambah.

## Cara pasang

1. Spreadsheet → Extensions → Apps Script → tempel `apps-script/Code.gs` → Save.
2. Jalankan **`setup`** sekali → izinkan akses. Di Log eksekusi akan terlihat berapa foto yang cocok.
3. Isi **DaftarRuang** dengan ruang yang sebenarnya.
4. Deploy → New deployment → Web app → *Execute as: Me*, *Who has access: Anyone* → salin URL `/exec` ke `config.js`.
5. GitHub repo `umum` → Settings → Pages → Branch `main` / root.

**Admin Umum** (bisa menyetujui/menolak ruang dan BBM, serta memproses SPPD): NIP yang ditulis di `Pengaturan › ADMIN_NIP`.
Bila kosong, admin = semua pegawai unit SIE ADM DAN MUM dan BAG KEU DAN MUM.

**Foto pegawai:** dicocokkan otomatis bila nama file memuat NIP (mis. `8809008H2.jpg`) atau nama lengkap (mis. `FATMA ULAN SARI.jpg`).
Folder foto harus dibagikan "Siapa saja yang memiliki link: Viewer" agar foto tampil.
Setelah menambah foto, jalankan `refreshFoto` di Apps Script (atau tunggu 6 jam).

Jika `Code.gs` diubah: Deploy → Manage deployments → Edit → Version: New version.
Jika file aplikasi diubah: naikkan `V` di `sw.js` dan `?v=` di `index.html`.

## Mode demo
Jika `API_URL` kosong, aplikasi memakai data contoh. Login dengan NIP `8809008H2` (admin), `7293084H`, atau GUEST.
