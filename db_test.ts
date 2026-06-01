import prisma from "./src/lib/prisma";

async function main() {
  const r = await prisma.riwayatSantri.findMany({
    where: { santri: { nama: { contains: "Juaini" } } },
    include: { nilaiList: true, program: true }
  });
  console.log(JSON.stringify(r, null, 2));
}

main().catch(console.error);
