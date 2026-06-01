import prisma from "./src/lib/prisma";

async function main() {
  const k = await prisma.kelas.findMany({ include: { program: true } });
  console.log(k.map(x => ({ id: x.id, nama: x.nama, program: x.program.nama_indo })));
}
main().catch(console.error);
