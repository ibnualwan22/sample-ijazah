import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const unassignedRiwayats = await prisma.riwayatSantri.findMany({
    where: { kelasId: null, programId: null },
    include: { santri: true }
  });

  const previousRiwayats = await prisma.riwayatSantri.findMany({
    where: { santriId: { in: unassignedRiwayats.map(ms => ms.santriId) } },
    include: { program: true },
    orderBy: { id: 'desc' }
  });

  const santriToAkbarnasClass = new Map<string, {programId: string, kelasId: string}>();
  for (const pr of previousRiwayats) {
    if (!santriToAkbarnasClass.has(pr.santriId) && pr.program && pr.program.nama_indo.toLowerCase().includes("akbarnas")) {
      if (pr.kelasId && pr.programId) {
          santriToAkbarnasClass.set(pr.santriId, { programId: pr.programId, kelasId: pr.kelasId });
      }
    }
  }

  let updatedCount = 0;
  for (const ur of unassignedRiwayats) {
    const pastAkbarnas = santriToAkbarnasClass.get(ur.santriId);
    if (pastAkbarnas) {
      await prisma.riwayatSantri.update({
        where: { id: ur.id },
        data: {
          programId: pastAkbarnas.programId,
          kelasId: pastAkbarnas.kelasId
        }
      });
      updatedCount++;
    }
  }

  console.log(`Successfully restored ${updatedCount} Akbarnas students to their previous classes!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
