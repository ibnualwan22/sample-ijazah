import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const kelas = await prisma.kelas.findFirst({
    where: { program: { nama_indo: { contains: "akbarnas", mode: "insensitive" } } },
    include: { program: true }
  });
  console.log("Kelas:", kelas?.nama, "Program:", kelas?.program?.nama_indo);
  
  if (!kelas) return;

  const riwayatList = await prisma.riwayatSantri.findMany({
    where: { kelasId: kelas.id }
  });
  console.log("Riwayat in this kelas:", riwayatList.length);

  const santriIds = riwayatList.map(r => r.santriId);
  console.log("Santri IDs:", santriIds);

  const pastRiwayat = await prisma.riwayatSantri.count({
    where: {
      santriId: { in: santriIds },
      program: { nama_indo: { contains: "akbarnas", mode: "insensitive" } },
      id: { notIn: riwayatList.map(r => r.id) }
    }
  });

  console.log("Past Riwayat Count:", pastRiwayat);
}

main().catch(console.error).finally(() => prisma.$disconnect());
