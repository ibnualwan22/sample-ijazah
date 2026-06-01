import prisma from "./src/lib/prisma";

async function main() {
  const akbarnas = await prisma.program.findFirst({
    where: { nama_indo: 'Akbarnas' },
    include: {
      programMapels: {
        include: { mapel: true },
        orderBy: { urutan: 'asc' }
      }
    }
  });
  if (!akbarnas) return;
  console.log("Akbarnas Mapels:");
  for (const pm of akbarnas.programMapels) {
    console.log(`- ${pm.mapel.nama_indo} (bulan_aktif: ${pm.mapel.bulan_aktif})`);
  }
}
main().catch(console.error);
