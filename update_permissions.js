const fs = require('fs');
const path = require('path');

const newPermissionsArray = `const AVAILABLE_PERMISSIONS = [
  { id: "dashboard", label: "Dashboard Admin", desc: "Akses ke halaman dashboard utama admin" },
  { id: "absen_sakan", label: "Absen Sakan", desc: "Akses untuk absen kehadiran di asrama" },
  { id: "absen_kelas", label: "Absen Kelas", desc: "Akses untuk absen kehadiran santri di kelas" },
  { id: "absen_kegiatan", label: "Absen Kegiatan", desc: "Akses untuk absen kegiatan santri" },
  { id: "rekap_sakan", label: "Rekap Sakan", desc: "Akses untuk melihat rekap kehadiran sakan" },
  { id: "rekap_kelas", label: "Rekap Kelas", desc: "Akses untuk melihat rekap kehadiran kelas" },
  { id: "rekap_kegiatan", label: "Rekap Kegiatan", desc: "Akses untuk melihat rekap kegiatan" },
  { id: "rekap_pengajar", label: "Rekap Pengajar", desc: "Akses untuk melihat laporan absen pengajar" },
  { id: "pengaturan_kegiatan", label: "Pengaturan Kegiatan", desc: "Akses untuk mengatur jenis kegiatan absensi" },
  { id: "manajemen_kelas", label: "Manajemen Kelas (Lihat)", desc: "Akses untuk melihat kelas dan plotting santri" },
  { id: "manajemen_kelas_edit", label: "Manajemen Kelas (Aksi)", desc: "Akses untuk mengatur pengajar, jadwal, dan mengedit plotting" },
  { id: "manajemen_sesi", label: "Jadwal Buka/Tutup Sesi", desc: "Akses untuk mengatur jadwal mengajar (sesi)" },
  { id: "manajemen_dufah", label: "Manajemen Angkatan & Usbu'", desc: "Akses untuk tambah/edit angkatan dan usbu'" },
  { id: "manajemen_user", label: "Manajemen User & Role", desc: "Akses khusus Super Admin" },
  { id: "manajemen_konten", label: "Manajemen Konten (Landing Page)", desc: "Akses untuk mengatur konten Instagram dan Agenda Rutinan" },
  { id: "data_syahadah", label: "Data Syahadah", desc: "Akses untuk melihat daftar syahadah dan profil santri" },
  { id: "input_nilai", label: "Input Nilai Santri", desc: "Akses untuk menginput nilai dan status kelulusan santri" },
  { id: "cetak_nilai_pekanan", label: "Cetak Nilai Pekanan", desc: "Akses untuk melihat dan mencetak nilai pekanan santri" },
  { id: "layout_syahadah", label: "Layout Syahadah", desc: "Akses untuk mendesain layout cetak syahadah" },
  { id: "riwayat_santri", label: "Riwayat Santri", desc: "Akses untuk melihat riwayat historis santri (Duf'ah sebelumnya)" },
  { id: "pengaturan_syahadah", label: "Pengaturan Syahadah", desc: "Akses ke pengaturan syahadah (Kop, TTD, Bobot Mapel, dll)" }
];`;

const replacements = [
  {
    file: 'src/components/admin/sidebar.tsx',
    replaces: [
      { from: 'permissionId: "manajemen_dufah" },\n      { href: "/admin/manajemen-konten/instagram"', to: 'permissionId: "manajemen_konten" },\n      { href: "/admin/manajemen-konten/instagram"' },
      { from: 'icon: Instagram, permissionId: "manajemen_dufah"', to: 'icon: Instagram, permissionId: "manajemen_konten"' },
      { from: 'icon: Settings, permissionId: "manajemen_dufah" },', to: 'icon: Settings, permissionId: "pengaturan_kegiatan" },' }
    ]
  },
  {
    file: 'src/app/admin/absensi/pengaturan/page.tsx',
    replaces: [{ from: 'requirePermission("manajemen_dufah")', to: 'requirePermission("pengaturan_kegiatan")' }]
  },
  {
    file: 'src/app/admin/manajemen-konten/agenda/page.tsx',
    replaces: [{ from: 'requirePermission("manajemen_dufah")', to: 'requirePermission("manajemen_konten")' }]
  },
  {
    file: 'src/app/admin/manajemen-konten/instagram/page.tsx',
    replaces: [{ from: 'requirePermission("manajemen_dufah")', to: 'requirePermission("manajemen_konten")' }]
  }
];

for (const rep of replacements) {
  const filePath = path.join('/home/ibnualwan/ijazah-sample', rep.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const r of rep.replaces) {
      content = content.replace(r.from, r.to);
    }
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${rep.file}`);
  } else {
    console.log(`File not found: ${rep.file}`);
  }
}

// Update the AVAILABLE_PERMISSIONS in manajemen-role/page.tsx
const rolePagePath = path.join('/home/ibnualwan/ijazah-sample', 'src/app/admin/manajemen-role/page.tsx');
if (fs.existsSync(rolePagePath)) {
  let roleContent = fs.readFileSync(rolePagePath, 'utf8');
  // Use regex to replace the entire AVAILABLE_PERMISSIONS array
  roleContent = roleContent.replace(/const AVAILABLE_PERMISSIONS = \[\s*\{[\s\S]*?\];/, newPermissionsArray);
  fs.writeFileSync(rolePagePath, roleContent);
  console.log('Updated src/app/admin/manajemen-role/page.tsx');
}
