const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const kelasId = 'cmnosvsyl0002jore1pqed8n5';
  const targetUsbu = 1;
  const isMonth2 = false; // from URL ?bulan=1

  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: {
      program: {
        include: {
          programMapels: {
            include: { mapel: true },
            orderBy: { urutan: "asc" }
          }
        }
      }
    }
  });

  const currentClassRiwayats = await prisma.riwayatSantri.findMany({
    where: { kelasId },
    select: { santriId: true, dufahNama: true }
  });
  
  const activeStudentIdsInClass = currentClassRiwayats.map(r => r.santriId);

  const allAkbarnasRiwayats = await prisma.riwayatSantri.findMany({
    where: {
      santriId: { in: activeStudentIdsInClass },
      program: { nama_indo: { contains: "akbarnas", mode: "insensitive" } }
    },
    orderBy: { id: "asc" },
    include: { santri: true, nilaiList: true }
  });

  const riwayatBulanMap = new Map();
  for (const r of allAkbarnasRiwayats) {
    if (!riwayatBulanMap.has(r.santriId)) {
      riwayatBulanMap.set(r.santriId, { bulan1: r, bulan2: null });
    } else {
      riwayatBulanMap.get(r.santriId).bulan2 = r;
    }
  }

  let riwayatList = [];
  activeStudentIdsInClass.forEach(santriId => {
    const map = riwayatBulanMap.get(santriId);
    if (map) {
      const targetR = isMonth2 ? map.bulan2 : map.bulan1;
      if (targetR) riwayatList.push(targetR);
    }
  });

  const activeMapels = kelas.program.programMapels.filter(pm => {
    if (isMonth2) {
      return pm.mapel.bulan_aktif !== 1;
    } else {
      return pm.mapel.bulan_aktif !== 2;
    }
  });

  const r = riwayatList[0];
  console.log(`Santri: ${r.santri.nama}`);
  
  for (const pm of activeMapels) {
    const match = r.nilaiList.find(n => n.mapelId === pm.mapelId);
    let score = null;
    if (match) {
        if (targetUsbu === 1) score = match.nilaiUsbu1 ?? match.nilaiAkhir;
        if (targetUsbu === 2) score = match.nilaiUsbu2 ?? match.nilaiAkhir;
        if (targetUsbu === 3) score = match.nilaiNihai ?? match.nilaiAkhir;
    }
    console.log(`  Mapel: ${pm.mapel.nama_indo}, U1: ${match?.nilaiUsbu1}, U2: ${match?.nilaiUsbu2}, N: ${match?.nilaiNihai}, A: ${match?.nilaiAkhir} -> SCORE: ${score}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
