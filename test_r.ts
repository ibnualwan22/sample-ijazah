import prisma from "./src/lib/prisma";

async function main() {
  const rList = await prisma.riwayatSantri.findMany({
    where: { kelasId: 'cmn2nd0ki00017z65eiilxk37' },
    include: { santri: true, nilaiList: true }
  });
  console.log("Riwayats:", JSON.stringify(rList.map(r => ({
    id: r.id,
    santri: r.santri?.nama,
    dufah: r.dufahNama,
    nilaiCount: r.nilaiList.length,
    nilais: r.nilaiList.map(n => ({ mapel: n.mapelId, u1: n.nilaiUsbu1 }))
  })), null, 2));
}
main().catch(console.error);
