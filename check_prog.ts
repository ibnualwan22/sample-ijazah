import prisma from "./src/lib/prisma";

async function main() {
  const p = await prisma.program.findMany({ where: { nama_indo: { contains: "akbarnas", mode: "insensitive" } }});
  console.log(p);
}
main().catch(console.error);
