-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "nama_indo" TEXT NOT NULL,
    "nama_arab" TEXT NOT NULL,
    "kkm" INTEGER NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mapel" (
    "id" TEXT NOT NULL,
    "nama_indo" TEXT NOT NULL,
    "nama_arab" TEXT NOT NULL,

    CONSTRAINT "Mapel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramMapel" (
    "programId" TEXT NOT NULL,
    "mapelId" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,

    CONSTRAINT "ProgramMapel_pkey" PRIMARY KEY ("programId","mapelId")
);

-- CreateTable
CREATE TABLE "SantriInternal" (
    "id" TEXT NOT NULL,
    "tempat_lahir" TEXT,
    "tanggal_lahir" TEXT,
    "alamat" TEXT,

    CONSTRAINT "SantriInternal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiwayatSantri" (
    "id" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "dufahNama" TEXT NOT NULL,
    "programId" TEXT,
    "kelasId" TEXT,
    "is_tasmi" BOOLEAN NOT NULL DEFAULT false,
    "status_kelulusan" TEXT NOT NULL DEFAULT 'TIDAK_LULUS',

    CONSTRAINT "RiwayatSantri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nilai" (
    "id" TEXT NOT NULL,
    "riwayatId" TEXT NOT NULL,
    "mapelId" TEXT NOT NULL,
    "skor" INTEGER NOT NULL,

    CONSTRAINT "Nilai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyahadahTemplate" (
    "id" SERIAL NOT NULL,
    "tgl_cetak_indo" TEXT NOT NULL,
    "tgl_cetak_arab" TEXT NOT NULL,
    "tgl_mulai_indo" TEXT,
    "tgl_mulai_arab" TEXT,
    "tgl_selesai_indo" TEXT,
    "tgl_selesai_arab" TEXT,
    "nama_mudir_indo" TEXT NOT NULL,
    "nama_mudir_arab" TEXT NOT NULL,
    "jabatan_mudir_indo" TEXT NOT NULL,
    "jabatan_mudir_arab" TEXT NOT NULL,

    CONSTRAINT "SyahadahTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Program_nama_indo_key" ON "Program"("nama_indo");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_nama_key" ON "Kelas"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Mapel_nama_indo_key" ON "Mapel"("nama_indo");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramMapel_programId_urutan_key" ON "ProgramMapel"("programId", "urutan");

-- CreateIndex
CREATE UNIQUE INDEX "RiwayatSantri_santriId_dufahNama_key" ON "RiwayatSantri"("santriId", "dufahNama");

-- CreateIndex
CREATE UNIQUE INDEX "Nilai_riwayatId_mapelId_key" ON "Nilai"("riwayatId", "mapelId");

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramMapel" ADD CONSTRAINT "ProgramMapel_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramMapel" ADD CONSTRAINT "ProgramMapel_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "Mapel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatSantri" ADD CONSTRAINT "RiwayatSantri_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "SantriInternal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatSantri" ADD CONSTRAINT "RiwayatSantri_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatSantri" ADD CONSTRAINT "RiwayatSantri_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_riwayatId_fkey" FOREIGN KEY ("riwayatId") REFERENCES "RiwayatSantri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "Mapel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
