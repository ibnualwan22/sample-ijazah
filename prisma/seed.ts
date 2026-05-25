import { PrismaClient } from "@prisma/client";
import { PROGRAM_SEED_DATA } from "../src/lib/academic-config";
import { formatDateIndo, translateDateToArabic } from "../src/lib/formatters";

const ORIGINAL_DEFAULTS: Record<string, { bobot?: number; bobot_usbu?: number; masuk_akumulasi?: boolean; tampil_di_syahadah?: boolean; jumlah_tes?: number; bulan_aktif?: number; jumlah_tes_b2?: number | null; nama_arab: string }> = {
  // Shifr
  "Shifr_Presensi": { bobot_usbu: 10, bobot: 10, nama_arab: "الحضور" },
  "Shifr_Istima'": { bobot_usbu: 18, bobot: 16, nama_arab: "الاستماع" },
  "Shifr_Kalam": { bobot_usbu: 18, bobot: 16, nama_arab: "الكلام" },
  "Shifr_Anashir Al-Lughah": { bobot_usbu: 18, bobot: 16, nama_arab: "عناصر اللغة" },
  "Shifr_Qiraah": { bobot_usbu: 18, bobot: 16, nama_arab: "القراءة" },
  "Shifr_Kitabah": { bobot_usbu: 18, bobot: 16, nama_arab: "الكتابة" },
  "Shifr_Mufradat": { bobot_usbu: 0, bobot: 10, nama_arab: "المفردات" },

  // I'dad Awal
  "I'dad Awal_Presensi": { bobot_usbu: 10, bobot: 10, nama_arab: "الحضور" },
  "I'dad Awal_Kalam": { bobot_usbu: 25, bobot: 30, nama_arab: "الكلام" },
  "I'dad Awal_Mufradat": { bobot_usbu: 20, bobot: 20, nama_arab: "المفردات" },
  "I'dad Awal_Ta'birat": { bobot_usbu: 25, bobot: 20, nama_arab: "التعبيرات" },
  "I'dad Awal_Qawaid": { bobot_usbu: 20, bobot: 20, nama_arab: "القواعد" },
  "I'dad Awal_Vlog": { bobot_usbu: 0, bobot: 0, masuk_akumulasi: false, nama_arab: "الفلوغ" },

  // I'dad Tsani
  "I'dad Tsani_Presensi": { bobot_usbu: 10, bobot: 10, nama_arab: "الحضور" },
  "I'dad Tsani_Kalam": { bobot_usbu: 25, bobot: 25, nama_arab: "الكلام" },
  "I'dad Tsani_Kitabah": { bobot_usbu: 20, bobot: 20, nama_arab: "الكتابة" },
  "I'dad Tsani_Ta'birat": { bobot_usbu: 20, bobot: 20, nama_arab: "التعبيرات" },
  "I'dad Tsani_Qawaid": { bobot_usbu: 15, bobot: 15, nama_arab: "القواعد" },
  "I'dad Tsani_Mufradat": { bobot_usbu: 10, bobot: 10, nama_arab: "المفردات" },

  // Syarqi Awwal
  "Syarqi Awwal_Presensi": { bobot_usbu: 10, bobot: 10, nama_arab: "الحضور" },
  "Syarqi Awwal_Kalam": { bobot_usbu: 25, bobot: 30, nama_arab: "الكلام" },
  "Syarqi Awwal_Qiraah": { bobot_usbu: 20, bobot: 20, nama_arab: "القراءة" },
  "Syarqi Awwal_Istima'": { bobot_usbu: 18, bobot: 15, nama_arab: "الاستماع" },
  "Syarqi Awwal_Tarakib": { bobot_usbu: 17, bobot: 15, nama_arab: "التراكيب" },
  "Syarqi Awwal_Qiraah Al-Akhbar": { bobot_usbu: 0, bobot: 10, nama_arab: "قراءة الأخبار" },
  "Syarqi Awwal_Mufradat": { bobot_usbu: 10, bobot: 10, nama_arab: "المفردات" },

  // Syarqi Tsany
  "Syarqi Tsany_Presensi": { bobot_usbu: 10, bobot: 10, nama_arab: "الحضور" },
  "Syarqi Tsany_Kalam": { bobot_usbu: 25, bobot: 25, nama_arab: "الكلام" },
  "Syarqi Tsany_Kitabah": { bobot_usbu: 20, bobot: 20, nama_arab: "الكتابة" },
  "Syarqi Tsany_Qawaid": { bobot_usbu: 15, bobot: 20, nama_arab: "القواعد" },
  "Syarqi Tsany_Balaghah": { bobot_usbu: 10, bobot: 15, nama_arab: "البلاغة" },
  "Syarqi Tsany_Mufradat": { bobot_usbu: 20, bobot: 10, nama_arab: "المفردات" },

  // Atiqah
  "Atiqah_Presensi": { bobot_usbu: 10, bobot: 10, nama_arab: "الحضور" },
  "Atiqah_Qiraah": { bobot_usbu: 45, bobot: 35, nama_arab: "القراءة" },
  "Atiqah_Qawaid": { bobot_usbu: 45, bobot: 35, nama_arab: "القواعد" },
  "Atiqah_Sharf": { bobot_usbu: 0, bobot: 20, nama_arab: "الصرف" },

  // Takhasus Awal
  "Takhasus Awal_Presensi": { bobot_usbu: 10, bobot: 0, nama_arab: "الحضور" },
  "Takhasus Awal_Qiraah": { bobot_usbu: 30, bobot: 20, nama_arab: "القراءة" },
  "Takhasus Awal_Nahwu": { bobot_usbu: 25, bobot: 25, nama_arab: "النحو" },
  "Takhasus Awal_Sharf": { bobot_usbu: 20, bobot: 20, nama_arab: "الصرف" },
  "Takhasus Awal_I'lal": { bobot_usbu: 15, bobot: 15, nama_arab: "الإعلال" },
  "Takhasus Awal_Nadzam": { bobot_usbu: 0, bobot: 10, nama_arab: "النظم" },

  // Takhasus Tsani
  "Takhasus Tsani_Presensi": { bobot_usbu: 10, bobot: 0, nama_arab: "الحضور" },
  "Takhasus Tsani_Qiraah": { bobot_usbu: 30, bobot: 20, nama_arab: "القراءة" },
  "Takhasus Tsani_Nahwu": { bobot_usbu: 25, bobot: 25, nama_arab: "النحو" },
  "Takhasus Tsani_Sharf": { bobot_usbu: 20, bobot: 18, nama_arab: "الصرف" },
  "Takhasus Tsani_I'rab": { bobot_usbu: 15, bobot: 17, nama_arab: "الإعراب" },
  "Takhasus Tsani_Nadzam": { bobot_usbu: 0, bobot: 10, nama_arab: "النظم" },

  // Akbarnas
  "Akbarnas_Presensi": { bobot_usbu: 10, bobot: 5, nama_arab: "الحضور" },
  "Akbarnas_Kalam": { bobot_usbu: 30, bobot: 37, nama_arab: "الكلام" },
  "Akbarnas_Istima'": { bobot_usbu: 20, bobot: 9, nama_arab: "الاستماع" },
  "Akbarnas_Uslub": { bobot_usbu: 15, bobot: 15, nama_arab: "الأسلوب" },
  "Akbarnas_Mufradat": { bobot_usbu: 10, bobot: 8, nama_arab: "المفردات" },
  "Akbarnas_Ta'birat": { bobot_usbu: 15, bobot: 8, nama_arab: "التعبيرات" },
  "Akbarnas_Qawaid": { bobot_usbu: 15, bobot: 9, nama_arab: "القواعد" },
  "Akbarnas_Hiwar": { bobot_usbu: 20, bobot: 9, nama_arab: "الحوار" },
  "Akbarnas_Arabiyah Lin Nasyiin": { bobot_usbu: 15, bobot: 0, nama_arab: "العربية للناشئين" },
  "Akbarnas_MC": { bobot_usbu: 0, bobot: 0, masuk_akumulasi: false, nama_arab: "إم سي" },
  "Akbarnas_Dubbing": { bobot_usbu: 0, bobot: 0, masuk_akumulasi: false, nama_arab: "الدبلجة" },
  "Akbarnas_Taqdimul Qishah": { bobot_usbu: 0, bobot: 0, masuk_akumulasi: false, nama_arab: "تقديم القصة" },
};

const prisma = new PrismaClient();

async function seedProgramAndMapel() {
  for (const programData of PROGRAM_SEED_DATA) {
    const program = await prisma.program.upsert({
      where: { nama_indo: programData.nama_indo },
      update: {}, // Jangan timpa kustomisasi program di DB
      create: {
        nama_indo: programData.nama_indo,
        nama_arab: programData.nama_arab,
        kkm: programData.kkm,
      },
    });

    // Ambil daftar relasi lama untuk program ini agar kita tahu mapel mana saja milik program ini
    const oldRels = await prisma.programMapel.findMany({
      where: { programId: program.id },
      include: { mapel: true },
    });
    const oldMapelMap = new Map(oldRels.map(r => [r.mapel.nama_indo, r.mapel]));

    // Hapus relasi lama agar urutan bisa di-rebuild tanpa konflik unique constraint
    await prisma.programMapel.deleteMany({ where: { programId: program.id } });

    // Ambil daftar riwayatId untuk program ini agar siap melakukan migrasi Nilai jika diperlukan
    const riwayatList = await prisma.riwayatSantri.findMany({
      where: { programId: program.id },
      select: { id: true }
    });
    const riwayatIds = riwayatList.map(r => r.id);

    for (const [index, mapelData] of programData.mapel.entries()) {
      let mapel = oldMapelMap.get(mapelData.nama_indo);
      let needsMigrationFromOldId: string | null = null;

      if (mapel) {
        // Cek apakah mapel ini MASIH dipakai/di-share oleh program lain
        const otherProgramCount = await prisma.programMapel.count({
          where: { mapelId: mapel.id, programId: { not: program.id } }
        });

        // Jika dipakai program lain, kita pisahkan agar setiap program memiliki entitas Mapel mandiri
        // dan migrasikan data Nilai lama santri ke entitas Mapel yang baru ini.
        if (otherProgramCount > 0) {
          needsMigrationFromOldId = mapel.id;
          mapel = undefined; // Force create new independent mapel
        }
      }

      if (!mapel) {
        // Cari mapel dengan nama tersebut yang belum dipakai program manapun
        mapel = await prisma.mapel.findFirst({
          where: {
            nama_indo: mapelData.nama_indo,
            programMapels: { none: {} },
          },
        }) ?? undefined;
      }

      if (mapel) {
        // Cek apakah ada perubahan di konfigurasi seed (academic-config.ts) dibanding nilai bawaan awal.
        // Jika ada perubahan (artinya user mengedit file seed), update ke DB.
        // Jika tidak ada perubahan, pertahankan nilai di DB (agar kustomisasi manual user tidak hilang).
        const key = `${program.nama_indo}_${mapelData.nama_indo}`;
        const def = ORIGINAL_DEFAULTS[key] || {
          nama_arab: mapelData.nama_arab,
          bobot: mapelData.bobot ?? 1,
          bobot_usbu: mapelData.bobot_usbu ?? 1,
          masuk_akumulasi: mapelData.masuk_akumulasi ?? true,
          tampil_di_syahadah: mapelData.tampil_di_syahadah ?? true,
          jumlah_tes: mapelData.jumlah_tes ?? 3,
          bulan_aktif: mapelData.bulan_aktif ?? 0,
          jumlah_tes_b2: mapelData.jumlah_tes_b2 ?? null,
        };

        const hasUpdateInSeed = 
          mapelData.nama_arab !== def.nama_arab ||
          (mapelData.bobot ?? 1) !== (def.bobot ?? 1) ||
          (mapelData.bobot_usbu ?? 1) !== (def.bobot_usbu ?? 1) ||
          (mapelData.masuk_akumulasi ?? true) !== (def.masuk_akumulasi ?? true) ||
          (mapelData.tampil_di_syahadah ?? true) !== (def.tampil_di_syahadah ?? true) ||
          (mapelData.jumlah_tes ?? 3) !== (def.jumlah_tes ?? 3) ||
          (mapelData.bulan_aktif ?? 0) !== (def.bulan_aktif ?? 0) ||
          (mapelData.jumlah_tes_b2 ?? null) !== (def.jumlah_tes_b2 ?? null);

        if (hasUpdateInSeed) {
          console.log(`[SEED UPDATE] Menemukan perubahan konfigurasi seed untuk Mapel '${mapelData.nama_indo}' di Program '${program.nama_indo}'. Memperbarui database...`);
          await prisma.mapel.update({
            where: { id: mapel.id },
            data: {
              nama_arab: mapelData.nama_arab,
              bobot: mapelData.bobot ?? 1,
              bobot_usbu: mapelData.bobot_usbu ?? 1,
              masuk_akumulasi: mapelData.masuk_akumulasi ?? true,
              tampil_di_syahadah: mapelData.tampil_di_syahadah ?? true,
              jumlah_tes: mapelData.jumlah_tes ?? 3,
              bulan_aktif: mapelData.bulan_aktif ?? 0,
              jumlah_tes_b2: mapelData.jumlah_tes_b2 ?? null,
            },
          });
        }
      } else {
        mapel = await prisma.mapel.create({
          data: {
            nama_indo: mapelData.nama_indo,
            nama_arab: mapelData.nama_arab,
            bobot: mapelData.bobot ?? 1,
            bobot_usbu: mapelData.bobot_usbu ?? 1,
            masuk_akumulasi: mapelData.masuk_akumulasi ?? true,
            tampil_di_syahadah: mapelData.tampil_di_syahadah ?? true,
            jumlah_tes: mapelData.jumlah_tes ?? 3,
            bulan_aktif: mapelData.bulan_aktif ?? 0,
            jumlah_tes_b2: mapelData.jumlah_tes_b2 ?? null,
          },
        });

        if (needsMigrationFromOldId && riwayatIds.length > 0) {
          await prisma.nilai.updateMany({
            where: {
              mapelId: needsMigrationFromOldId,
              riwayatId: { in: riwayatIds }
            },
            data: { mapelId: mapel.id }
          });
        }
      }

      await prisma.programMapel.create({
        data: {
          programId: program.id,
          mapelId: mapel.id,
          urutan: index + 1,
        },
      });
    }
  }
}

async function seedTemplate() {
  const existingTemplate = await prisma.syahadahTemplate.findFirst();
  const today = new Date();

  if (!existingTemplate) {
    await prisma.syahadahTemplate.create({
      data: {
        tgl_cetak_indo: formatDateIndo(today),
        tgl_cetak_arab: translateDateToArabic(today),
        nama_mudir_indo: "Nama Mudir",
        nama_mudir_arab: "اسم المدير",
        jabatan_mudir_indo: "Mudir Markaz Arabiyah",
        jabatan_mudir_arab: "مدير مركز العربية",
      },
    });
  }
}

async function main() {
  await seedProgramAndMapel();
  await seedTemplate();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
